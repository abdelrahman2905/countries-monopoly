import type * as Party from "partykit/server";
import { apply, botAction, currentPlayer, newGame, type Action, type GameState } from "../shared/game";

type ClientMsg = { type: "JOIN"; name: string; token: string } | { type: "ACTION"; action: Exclude<Action, { type: "JOIN" }> };

const VALID_ACTIONS = new Set(["ADD_BOT", "START", "ROLL", "BUY", "END_TURN"]);

/** One PartyKit room = one game. The server owns all state; clients only send intents. */
export default class GameServer implements Party.Server {
  game: GameState;
  tokens = new Map<string, string>(); // secret client token -> public player id
  conns = new Map<string, string>(); // connection id -> public player id
  timer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {
    this.game = newGame(room.id);
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "STATE", state: this.game }));
  }

  onMessage(raw: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof raw !== "string" || raw.length > 1024) return;
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

  broadcast() {
    this.room.broadcast(JSON.stringify({ type: "STATE", state: this.game }));
    this.scheduleAuto();
  }

  /** Bots and disconnected players are played by the server with a short delay. */
  scheduleAuto() {
    if (this.timer || !botAction(this.game)) return;
    const delay = currentPlayer(this.game).isBot ? 1000 : 10000;
    this.timer = setTimeout(() => {
      this.timer = null;
      const a = botAction(this.game);
      if (a) apply(this.game, currentPlayer(this.game).id, a);
      this.broadcast();
    }, delay);
  }
}
