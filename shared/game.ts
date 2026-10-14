// Pure, server-authoritative game engine. Used by the PartyKit server;
// the client only imports the types and the BOARD data for rendering.

export const START_MONEY = 1500;
export const GO_SALARY = 200;
export const JAIL_INDEX = 8;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export type Square =
  | { kind: "go" | "jail" | "parking" | "gotojail" | "chance"; name: string; icon: string }
  | { kind: "country"; name: string; flag: string; price: number; rent: number; group: number };

export const GROUP_COLORS = [
  "#a16207", "#0891b2", "#db2777", "#ea580c", "#dc2626", "#ca8a04", "#16a34a", "#2563eb",
];

const c = (name: string, flag: string, price: number, group: number): Square => ({
  kind: "country", name, flag, price, rent: Math.round(price / 10), group,
});
const chance = (): Square => ({ kind: "chance", name: "Chance", icon: "❓" });

// 32 squares: 4 corners (0 Go, 8 Jail, 16 Free Parking, 24 Go To Jail), 4 Chance, 24 countries
export const BOARD: Square[] = [
  { kind: "go", name: "Go", icon: "🏁" },
  c("Egypt", "🇪🇬", 60, 0), c("Kenya", "🇰🇪", 60, 0), chance(),
  c("Morocco", "🇲🇦", 80, 0), c("India", "🇮🇳", 100, 1), c("Thailand", "🇹🇭", 100, 1), c("Vietnam", "🇻🇳", 120, 1),
  { kind: "jail", name: "Jail", icon: "🔒" },
  c("Turkey", "🇹🇷", 140, 2), c("Greece", "🇬🇷", 140, 2), chance(), c("Spain", "🇪🇸", 160, 2),
  c("Italy", "🇮🇹", 180, 3), c("Brazil", "🇧🇷", 180, 3), c("Argentina", "🇦🇷", 200, 3),
  { kind: "parking", name: "Free Parking", icon: "🅿️" },
  c("Mexico", "🇲🇽", 220, 4), c("Canada", "🇨🇦", 220, 4), chance(), c("Australia", "🇦🇺", 240, 4),
  c("France", "🇫🇷", 260, 5), c("Germany", "🇩🇪", 260, 5), c("Japan", "🇯🇵", 280, 5),
  { kind: "gotojail", name: "Go To Jail", icon: "🚔" },
  c("UK", "🇬🇧", 300, 6), c("Chile", "🇨🇱", 300, 6), chance(), c("Sweden", "🇸🇪", 320, 6),
  c("Switzerland", "🇨🇭", 350, 7), c("China", "🇨🇳", 380, 7), c("USA", "🇺🇸", 400, 7),
];

export const PLAYER_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#14b8a6"];

export type Player = {
  id: string;
  name: string;
  color: string;
  money: number;
  pos: number;
  jailed: boolean; // skips next turn
  bankrupt: boolean;
  connected: boolean;
  isBot: boolean;
};

export type Phase = "lobby" | "roll" | "action" | "over";

export type GameState = {
  code: string;
  phase: Phase;
  hostId: string | null;
  players: Player[];
  owners: Record<number, string>; // square index -> player id
  turn: number; // index into players
  round: number; // completed rounds, drives rent inflation
  dice: [number, number] | null;
  canBuy: number | null; // square index offered for purchase
  extraRoll: boolean; // rolled doubles, rolls again after this action
  winnerId: string | null;
  log: string[];
};

export type Action =
  | { type: "JOIN"; name: string }
  | { type: "ADD_BOT" }
  | { type: "START" }
  | { type: "ROLL" }
  | { type: "BUY" }
  | { type: "END_TURN" };

export type Rng = () => number;

export const newGame = (code: string): GameState => ({
  code, phase: "lobby", hostId: null, players: [], owners: {}, turn: 0, round: 0,
  dice: null, canBuy: null, extraRoll: false, winnerId: null, log: [],
});

const say = (g: GameState, msg: string) => {
  g.log.push(msg);
  if (g.log.length > 40) g.log.shift();
};
const alive = (g: GameState) => g.players.filter((p) => !p.bankrupt);
export const currentPlayer = (g: GameState) => g.players[g.turn];
const byId = (g: GameState, id: string) => g.players.find((p) => p.id === id);

export const ownsGroup = (g: GameState, playerId: string, group: number) =>
  BOARD.every((s, i) => s.kind !== "country" || s.group !== group || g.owners[i] === playerId);

export function rentFor(g: GameState, index: number): number {
  const s = BOARD[index];
  if (s.kind !== "country") return 0;
  const owner = g.owners[index];
  const base = owner && ownsGroup(g, owner, s.group) ? s.rent * 2 : s.rent;
  return Math.round(base * rentMultiplier(g));
}

/** Rents inflate over time so that every game eventually ends. */
export const INFLATION_EVERY = 3; // rounds per +15% rent
export const rentMultiplier = (g: GameState) => 1.15 ** Math.floor(g.round / INFLATION_EVERY);

/** Pay `amount` from `from` to `to` (null = bank). Bankrupts `from` if they can't cover it. */
function pay(g: GameState, from: Player, to: Player | null, amount: number) {
  if (from.money >= amount) {
    from.money -= amount;
    if (to) to.money += amount;
    return;
  }
  if (to) to.money += from.money;
  from.money = 0;
  from.bankrupt = true;
  for (const [i, o] of Object.entries(g.owners)) if (o === from.id) delete g.owners[Number(i)];
  say(g, `💥 ${from.name} can't pay $${amount} and is bankrupt!`);
}

function checkWinner(g: GameState) {
  const left = alive(g);
  if (g.phase !== "lobby" && g.phase !== "over" && left.length === 1) {
    g.phase = "over";
    g.winnerId = left[0].id;
    g.canBuy = null;
    say(g, `🏆 ${left[0].name} wins the game!`);
  }
}

function moveTo(g: GameState, p: Player, target: number, collectGo: boolean) {
  if (collectGo) {
    p.money += GO_SALARY;
    say(g, `${p.name} passed Go and collected $${GO_SALARY}.`);
  }
  p.pos = target;
}

function sendToJail(g: GameState, p: Player) {
  p.pos = JAIL_INDEX;
  p.jailed = true;
  g.extraRoll = false;
}

function drawChance(g: GameState, p: Player, rng: Rng) {
  switch (Math.floor(rng() * 7)) {
    case 0: say(g, `❓ ${p.name}: Tourism boom! Collect $100.`); p.money += 100; break;
    case 1: say(g, `❓ ${p.name}: Lost luggage. Pay $60.`); pay(g, p, null, 60); break;
    case 2: say(g, `❓ ${p.name}: Advance to Go!`); moveTo(g, p, 0, true); break;
    case 3:
      say(g, `❓ ${p.name}: Go back 3 squares.`);
      p.pos = (p.pos + BOARD.length - 3) % BOARD.length;
      landOn(g, p, rng, false);
      break;
    case 4: say(g, `❓ ${p.name}: Caught smuggling! Go to Jail.`); sendToJail(g, p); break;
    case 5:
      say(g, `❓ ${p.name}: Birthday! Every player gives $20.`);
      for (const o of alive(g)) if (o.id !== p.id) pay(g, o, p, 20);
      break;
    default: say(g, `❓ ${p.name}: Speeding fine. Pay $40.`); pay(g, p, null, 40);
  }
}

function landOn(g: GameState, p: Player, rng: Rng, allowChance = true) {
  const s = BOARD[p.pos];
  switch (s.kind) {
    case "gotojail":
      say(g, `🚔 ${p.name} goes to Jail.`);
      sendToJail(g, p);
      break;
    case "chance":
      if (allowChance) drawChance(g, p, rng);
      break;
    case "country": {
      const ownerId = g.owners[p.pos];
      if (!ownerId) {
        if (p.money >= s.price) g.canBuy = p.pos;
        else say(g, `${p.name} landed on ${s.flag} ${s.name} but can't afford $${s.price}.`);
      } else if (ownerId !== p.id) {
        const owner = byId(g, ownerId)!;
        const rent = rentFor(g, p.pos);
        say(g, `${p.name} pays $${rent} rent to ${owner.name} for ${s.flag} ${s.name}.`);
        pay(g, p, owner, rent);
      }
      break;
    }
    default:
      break;
  }
}

function nextTurn(g: GameState) {
  g.canBuy = null;
  g.dice = null;
  g.extraRoll = false;
  const n = g.players.length;
  for (let i = 1; i <= n * 2; i++) {
    const p = g.players[(g.turn + i) % n];
    if (p.bankrupt) continue;
    if ((g.turn + i) % n <= g.turn) g.round++;
    g.turn = (g.turn + i) % n;
    if (p.jailed) {
      p.jailed = false;
      say(g, `🔒 ${p.name} is released from Jail but skips this turn.`);
      continue;
    }
    g.phase = "roll";
    return;
  }
}

/** Apply a player's action. Returns an error string if the action is illegal. */
export function apply(g: GameState, playerId: string, a: Action, rng: Rng = Math.random): string | null {
  const err = applyInner(g, playerId, a, rng);
  if (!err && g.phase === "action" && currentPlayer(g).bankrupt) {
    // went bust mid-turn: nothing left to do, move on
    checkWinner(g);
    if (!g.winnerId) nextTurn(g);
  }
  return err;
}

function applyInner(g: GameState, playerId: string, a: Action, rng: Rng): string | null {
  const me = byId(g, playerId);

  if (a.type === "JOIN") {
    if (me) { me.connected = true; return null; }
    if (g.phase !== "lobby") return "Game already started.";
    if (g.players.length >= MAX_PLAYERS) return "Room is full.";
    const name = a.name.trim().slice(0, 16) || "Player";
    g.players.push({
      id: playerId, name, color: PLAYER_COLORS[g.players.length], money: START_MONEY, pos: 0,
      jailed: false, bankrupt: false, connected: true, isBot: false,
    });
    g.hostId ??= playerId;
    say(g, `${name} joined.`);
    return null;
  }

  if (!me) return "You are not in this game.";

  switch (a.type) {
    case "ADD_BOT": {
      if (g.phase !== "lobby") return "Game already started.";
      if (g.hostId !== playerId) return "Only the host can add bots.";
      if (g.players.length >= MAX_PLAYERS) return "Room is full.";
      const n = g.players.filter((p) => p.isBot).length + 1;
      g.players.push({
        id: `bot-${n}-${Math.floor(rng() * 1e6)}`, name: `Bot ${n}`, color: PLAYER_COLORS[g.players.length],
        money: START_MONEY, pos: 0, jailed: false, bankrupt: false, connected: true, isBot: true,
      });
      return null;
    }
    case "START":
      if (g.phase !== "lobby") return "Game already started.";
      if (g.hostId !== playerId) return "Only the host can start.";
      if (g.players.length < MIN_PLAYERS) return "Need at least 2 players (add a bot!).";
      g.phase = "roll";
      g.turn = 0;
      say(g, "🎲 Game started!");
      return null;
    case "ROLL": {
      if (g.phase !== "roll") return "You can't roll now.";
      if (currentPlayer(g).id !== playerId) return "Not your turn.";
      const d1 = 1 + Math.floor(rng() * 6), d2 = 1 + Math.floor(rng() * 6);
      g.dice = [d1, d2];
      const doubles = d1 === d2;
      say(g, `${me.name} rolled ${d1} + ${d2}${doubles ? " (doubles!)" : ""}.`);
      g.extraRoll = doubles;
      const raw = me.pos + d1 + d2;
      moveTo(g, me, raw % BOARD.length, raw >= BOARD.length);
      landOn(g, me, rng);
      g.phase = "action";
      checkWinner(g);
      return null;
    }
    case "BUY": {
      if (g.phase !== "action" || g.canBuy === null) return "Nothing to buy.";
      if (currentPlayer(g).id !== playerId) return "Not your turn.";
      const s = BOARD[g.canBuy];
      if (s.kind !== "country" || me.money < s.price) return "Can't afford that.";
      me.money -= s.price;
      g.owners[g.canBuy] = me.id;
      say(g, `${me.name} bought ${s.flag} ${s.name} for $${s.price}.`);
      g.canBuy = null;
      return null;
    }
    case "END_TURN": {
      if (g.phase !== "action") return "Roll first.";
      if (currentPlayer(g).id !== playerId) return "Not your turn.";
      if (g.extraRoll && !me.jailed) {
        g.canBuy = null; g.dice = null; g.extraRoll = false; g.phase = "roll";
        say(g, `${me.name} rolls again.`);
      } else nextTurn(g);
      return null;
    }
  }
}

/** Simple auto-player brain for bots and disconnected players. */
export function botAction(g: GameState): Action | null {
  const p = currentPlayer(g);
  if (!p || p.bankrupt || !(p.isBot || !p.connected)) return null;
  if (g.phase === "roll") return { type: "ROLL" };
  if (g.phase === "action") {
    if (g.canBuy !== null) {
      const s = BOARD[g.canBuy];
      if (s.kind === "country" && p.money - s.price >= 150) return { type: "BUY" };
    }
    return { type: "END_TURN" };
  }
  return null;
}
