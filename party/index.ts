import { Server, routePartykitRequest, type Connection } from "partyserver";
import {
  AUCTION_BID_SECONDS, AUCTION_FIRST_SECONDS, DEFAULT_SETTINGS, apply, botAction, botAuctionBid, currentPlayer, finishAuction, newGame,
  type Action, type GameState,
} from "../shared/game";

type ClientMsg = { type: "JOIN"; name: string; token: string } | { type: "ACTION"; action: Exclude<Action, { type: "JOIN" }> };

// The binding name "Main" is kebab-cased to the "main" party: clients connect to /parties/main/<room>.
type Env = { Main: DurableObjectNamespace<GameServer> };

const VALID_ACTIONS = new Set([
  "SET_PROFILE", "SET_SETTINGS", "ADD_BOT", "START", "ROLL", "BUY", "AUCTION", "BID", "TAKE_LOAN", "REPAY",
  "SELL_COUNTRY", "BUILD", "SELL", "END_TURN",
]);
const MAX_MSG_BYTES = 2048;
const MAX_MSGS_PER_SEC = 20;

/** One room = one game. The server owns all state; clients only send intents. */
export class GameServer extends Server<Env> {
  game: GameState = newGame("");
  tokens = new Map<string, string>(); // secret client token -> public player id
  conns = new Map<string, string>(); // connection id -> public player id
  rate = new Map<string, { sec: number; n: number }>();
  timer: ReturnType<typeof setTimeout> | null = null;
  turnKey = "";
  auctionKey = "";

  /** Restore the game after a restart so players don't lose their match. */
  async onStart() {
    this.game = newGame(this.name);
    try {
      const saved = await this.ctx.storage.get<{ game: GameState; tokens: [string, string][] }>("state");
      if (saved?.game) {
        // games saved by an older version miss newer fields: fill them with defaults
        this.game = { ...newGame(this.name), ...saved.game, settings: { ...DEFAULT_SETTINGS, ...saved.game.settings } };
        this.tokens = new Map(saved.tokens);
        for (const p of this.game.players) if (!p.isBot) p.connected = false; // they reconnect via JOIN
      }
    } catch (e) {
      console.error("failed to restore state", e);
    }
  }

  onConnect(conn: Connection) {
    this.updateDeadline(); // fresh timers after a restart or a long pause
    conn.send(JSON.stringify({ type: "STATE", state: this.game }));
    this.scheduleAuto(); // resume bots / idle players once someone is here
  }

  onMessage(sender: Connection, raw: string | ArrayBuffer | ArrayBufferView) {
    try {
      this.handle(raw, sender);
    } catch (e) {
      console.error("message error", e); // a bad message must never take the room down
      sender.send(JSON.stringify({ type: "ERROR", message: "Something went wrong." }));
    }
  }

  private handle(raw: string | ArrayBuffer | ArrayBufferView, sender: Connection) {
    if (typeof raw !== "string" || raw.length > MAX_MSG_BYTES) return;
    const sec = Math.floor(Date.now() / 1000);
    const r = this.rate.get(sender.id);
    if (!r || r.sec !== sec) this.rate.set(sender.id, { sec, n: 1 });
    else if (++r.n > MAX_MSGS_PER_SEC) return;

    let msg: ClientMsg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== "object") return;

    let error: string | null = null;
    if (msg.type === "JOIN") {
      const token = String(msg.token ?? "").slice(0, 64);
      if (!token) return;
      let id = this.tokens.get(token);
      const isNew = !id;
      id ??= crypto.randomUUID().slice(0, 8);
      error = apply(this.game, id, { type: "JOIN", name: String(msg.name ?? "") });
      if (!error) {
        if (isNew) this.tokens.set(token, id);
        this.conns.set(sender.id, id);
        sender.send(JSON.stringify({ type: "YOU", id }));
      }
    } else if (msg.type === "ACTION" && VALID_ACTIONS.has(msg.action?.type)) {
      const id = this.conns.get(sender.id);
      error = id ? apply(this.game, id, msg.action) : "Join the room first.";
    } else return;

    if (error) sender.send(JSON.stringify({ type: "ERROR", message: error }));
    this.broadcastState();
  }

  onClose(conn: Connection) {
    this.rate.delete(conn.id);
    const id = this.conns.get(conn.id);
    this.conns.delete(conn.id);
    if (!id) return;
    // ignore if the same player still has another open connection
    if ([...this.conns.values()].includes(id)) return;
    const g = this.game;
    const p = g.players.find((x) => x.id === id);
    if (!p) return;
    if (g.phase === "lobby") {
      g.players = g.players.filter((x) => x.id !== id);
      if (g.hostId === id) g.hostId = g.players.find((x) => !x.isBot)?.id ?? null;
    } else {
      p.connected = false; // the server auto-plays their turns until they return
    }
    this.broadcastState();
  }

  onError(_conn: Connection, err: unknown) {
    console.error("connection error", err);
  }

  broadcastState() {
    this.updateDeadline();
    this.broadcast(JSON.stringify({ type: "STATE", state: this.game }));
    this.ctx.storage.put("state", { game: this.game, tokens: [...this.tokens] }).catch((e) => console.error("persist failed", e));
    this.scheduleAuto();
  }

  /** Start a fresh turn timer whenever the turn/phase moves on. */
  private updateDeadline() {
    const g = this.game;
    if (g.phase === "auction" && g.auction) {
      // the auction closes a few seconds after the last bid
      const key = `${g.auction.bid}:${g.auction.bidderId}`;
      if (key !== this.auctionKey || g.auction.deadline === null) {
        this.auctionKey = key;
        g.auction.deadline = Date.now() + (g.auction.bidderId ? AUCTION_BID_SECONDS : AUCTION_FIRST_SECONDS) * 1000;
      }
    } else this.auctionKey = "";
    const inGame = g.phase === "roll" || g.phase === "action" || g.phase === "sell";
    if (!inGame || g.settings.turnTimer <= 0) { g.turnDeadline = null; this.turnKey = ""; return; }
    const key = `${g.phase}:${g.turn}:${g.round}:${g.dice}:${g.canBuy}`;
    if (key !== this.turnKey || g.turnDeadline === null) {
      this.turnKey = key;
      g.turnDeadline = Date.now() + g.settings.turnTimer * 1000;
    }
  }

  private hasPlayersOnline() {
    for (const _ of this.getConnections()) return true;
    return false;
  }

  /** Runs the auction: bots raise now and then, and the auction ends when the clock runs out. */
  private scheduleAuction() {
    this.timer = setTimeout(() => {
      this.timer = null;
      const g = this.game;
      const au = g.auction;
      if (g.phase === "auction" && au) {
        if (au.deadline !== null && Date.now() >= au.deadline) finishAuction(g);
        else {
          const bid = botAuctionBid(g, Math.random);
          if (bid) apply(g, bid.playerId, { type: "BID", inc: bid.inc });
        }
      }
      this.broadcastState();
    }, 1200);
  }

  /** Bots, offline players and idle players (turn timer) are played by the server. */
  private scheduleAuto() {
    const g = this.game;
    // the state just changed, so any pending timer was computed for the old state: start over
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (!this.hasPlayersOnline()) return;
    if (g.phase === "auction") return this.scheduleAuction();
    if (g.phase !== "roll" && g.phase !== "action" && g.phase !== "sell") return;
    const cur = currentPlayer(g);
    if (!cur) return;
    let delay: number | null = null;
    if (botAction(g)) delay = cur.isBot ? 1000 : 8000;
    else if (g.turnDeadline) delay = Math.max(0, g.turnDeadline - Date.now()) + 50;
    if (delay === null) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const now = this.game;
      const p = currentPlayer(now);
      const idle = !!now.turnDeadline && Date.now() >= now.turnDeadline;
      const a = p && (idle ? botAction(now, true) : botAction(now));
      if (a) {
        if (idle && !p.isBot && p.connected) {
          this.broadcast(JSON.stringify({ type: "NOTICE", message: `${p.name} ran out of time.` }));
        }
        apply(now, p.id, a);
      }
      this.broadcastState();
    }, delay);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await routePartykitRequest(request, env)) || new Response("Countries Monopoly game server", { status: 200 });
  },
} satisfies ExportedHandler<Env>;
