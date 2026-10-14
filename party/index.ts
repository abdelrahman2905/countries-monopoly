import type * as Party from "partykit/server";
import { apply, botAction, currentPlayer, newGame, type Action, type GameState } from "../shared/game";

type ClientMsg = { type: "JOIN"; name: string; token: string } | { type: "ACTION"; action: Exclude<Action, { type: "JOIN" }> };

const VALID_ACTIONS = new Set([
  "SET_PROFILE", "SET_SETTINGS", "ADD_BOT", "START", "ROLL", "BUY", "BUILD", "SELL", "END_TURN",
]);
const MAX_MSG_BYTES = 2048;
const MAX_MSGS_PER_SEC = 20;

/** One PartyKit room = one game. The server owns all state; clients only send intents. */
export default class GameServer implements Party.Server {
  game: GameState;
  tokens = new Map<string, string>(); // secret client token -> public player id
  conns = new Map<string, string>(); // connection id -> public player id
  rate = new Map<string, { sec: number; n: number }>();
  timer: ReturnType<typeof setTimeout> | null = null;
  turnKey = "";

  constructor(readonly room: Party.Room) {
    this.game = newGame(room.id);
  }

  /** Restore the game after a server restart so players don't lose their match. */
  async onStart() {
    try {
      const saved = await this.room.storage.get<{ game: GameState; tokens: [string, string][] }>("state");
      if (saved?.game) {
        this.game = saved.game;
        this.tokens = new Map(saved.tokens);
        for (const p of this.game.players) if (!p.isBot) p.connected = false; // they reconnect via JOIN
      }
    } catch (e) {
      console.error("failed to restore state", e);
    }
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "STATE", state: this.game }));
    this.scheduleAuto(); // resume bots / idle players once someone is here
  }

  onMessage(raw: string | ArrayBuffer, sender: Party.Connection) {
    try {
      this.handle(raw, sender);
    } catch (e) {
      console.error("message error", e); // a bad message must never take the room down
      sender.send(JSON.stringify({ type: "ERROR", message: "Something went wrong." }));
    }
  }

  private handle(raw: string | ArrayBuffer, sender: Party.Connection) {
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
    this.broadcast();
  }

  onClose(conn: Party.Connection) {
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
    this.broadcast();
  }

  onError(_conn: Party.Connection, err: Error) {
    console.error("connection error", err);
  }

  broadcast() {
    this.updateDeadline();
    this.room.broadcast(JSON.stringify({ type: "STATE", state: this.game }));
    this.room.storage.put("state", { game: this.game, tokens: [...this.tokens] }).catch((e) => console.error("persist failed", e));
    this.scheduleAuto();
  }

  /** Start a fresh turn timer whenever the turn/phase moves on. */
  private updateDeadline() {
    const g = this.game;
    const inGame = g.phase === "roll" || g.phase === "action";
    if (!inGame || g.settings.turnTimer <= 0) { g.turnDeadline = null; this.turnKey = ""; return; }
    const key = `${g.phase}:${g.turn}:${g.round}:${g.dice}:${g.canBuy}`;
    if (key !== this.turnKey || g.turnDeadline === null) {
      this.turnKey = key;
      g.turnDeadline = Date.now() + g.settings.turnTimer * 1000;
    }
  }

  private hasPlayersOnline() {
    for (const _ of this.room.getConnections()) return true;
    return false;
  }

  /** Bots, offline players and idle players (turn timer) are played by the server. */
  private scheduleAuto() {
    const g = this.game;
    if (this.timer || (g.phase !== "roll" && g.phase !== "action") || !this.hasPlayersOnline()) return;
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
          this.room.broadcast(JSON.stringify({ type: "NOTICE", message: `${p.name} ran out of time.` }));
        }
        apply(now, p.id, a);
      }
      this.broadcast();
    }, delay);
  }
}
