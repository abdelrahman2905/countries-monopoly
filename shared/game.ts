// Pure, server-authoritative game engine. Used by the PartyKit server;
// the client only imports the types and the BOARD data for rendering.

export const JAIL_INDEX = 10;
export const MIN_PLAYERS = 2;
export const MAX_BUILD_LEVEL = 5; // 1-4 houses, 5 = hotel

// ---------- Room settings (chosen by the host in the lobby) ----------
export type Settings = {
  startMoney: number;
  goSalary: number; // paid every time a player passes Go
  bonusAfterRounds: number; // from this round on, Go pays bonusSalary instead (0 = never)
  bonusSalary: number;
  turnTimer: number; // seconds per turn before the server plays for an idle player (0 = off)
  maxPlayers: number;
  buildings: boolean; // houses & hotels
  inflation: boolean; // rents rise over time so games end
  doublesRoll: boolean; // doubles give another roll
  freeParkingPot: boolean; // fines go to Free Parking, whoever lands there takes the pot
};

export const DEFAULT_SETTINGS: Settings = {
  startMoney: 1500, goSalary: 300, bonusAfterRounds: 5, bonusSalary: 1000, turnTimer: 90, maxPlayers: 6,
  buildings: true, inflation: true, doublesRoll: true, freeParkingPot: false,
};

export const SETTING_OPTIONS = {
  startMoney: [1000, 1500, 2000, 3000, 5000],
  goSalary: [0, 100, 200, 300, 500],
  bonusAfterRounds: [0, 3, 5, 8, 10],
  bonusSalary: [500, 1000, 1500, 2000],
  turnTimer: [0, 30, 60, 90, 120],
  maxPlayers: [2, 3, 4, 5, 6],
} as const;

/** What a player collects for passing Go right now. */
export const salaryFor = (g: GameState): number =>
  g.settings.bonusAfterRounds > 0 && g.round >= g.settings.bonusAfterRounds ? g.settings.bonusSalary : g.settings.goSalary;

/** Returns a cleaned copy of `patch` merged into `base`, or an error message. */
export function mergeSettings(base: Settings, patch: unknown): Settings | string {
  if (!patch || typeof patch !== "object") return "Invalid settings.";
  const next: Settings = { ...base };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (k in SETTING_OPTIONS) {
      if (!(SETTING_OPTIONS as Record<string, readonly number[]>)[k].includes(v as number)) return "Invalid value.";
      (next as Record<string, unknown>)[k] = v;
    } else if (k in DEFAULT_SETTINGS && typeof v === "boolean") {
      (next as Record<string, unknown>)[k] = v;
    } else return "Unknown setting.";
  }
  return next;
}

// ---------- Board ----------
export type Square =
  | { kind: "go" | "jail" | "parking" | "gotojail" | "chance"; name: string; icon: string }
  | {
      kind: "country"; name: string; iso: string; price: number; rent: number; group: number;
      colors: [string, string]; // main colors of the flag, used to style the tile
    };

// 12 color sets: four sets of 2 and eight sets of 3
export const GROUP_COLORS = [
  "#92400e", "#0ea5e9", "#d946ef", "#f97316", "#ef4444", "#eab308",
  "#22c55e", "#14b8a6", "#6366f1", "#84cc16", "#e11d48", "#1d4ed8",
];

const c = (iso: string, name: string, price: number, group: number, c1: string, c2: string): Square => ({
  kind: "country", name, iso, price, rent: Math.round(price / 10), group, colors: [c1, c2],
});
const chance = (): Square => ({ kind: "chance", name: "Chance", icon: "❓" });

// 40 squares: corners at 0 Go, 10 Jail, 20 Free Parking, 30 Go To Jail; 4 Chance; 32 countries
export const BOARD: Square[] = [
  { kind: "go", name: "Go", icon: "🏁" },
  c("ng", "Nigeria", 60, 0, "#008751", "#ffffff"), c("ke", "Kenya", 60, 0, "#bb0000", "#006600"), chance(),
  c("eg", "Egypt", 100, 1, "#ce1126", "#c09300"), c("ma", "Morocco", 100, 1, "#c1272d", "#006233"),
  c("dz", "Algeria", 120, 1, "#006233", "#d21034"),
  c("th", "Thailand", 140, 2, "#a51931", "#2d2a4a"), c("vn", "Vietnam", 140, 2, "#da251d", "#ffcd00"),
  c("id", "Indonesia", 160, 2, "#ce1126", "#ffffff"),
  { kind: "jail", name: "Jail", icon: "🔒" },
  c("pk", "Pakistan", 180, 3, "#01411c", "#ffffff"), c("bd", "Bangladesh", 180, 3, "#006a4e", "#f42a41"), chance(),
  c("in", "India", 200, 4, "#ff9933", "#138808"), c("sa", "Saudi Arabia", 200, 4, "#006c35", "#ffffff"),
  c("ir", "Iran", 220, 4, "#239f40", "#da0000"),
  c("tr", "Turkey", 240, 5, "#e30a17", "#ffffff"), c("gr", "Greece", 240, 5, "#0d5eaf", "#ffffff"),
  c("pl", "Poland", 260, 5, "#dc143c", "#ffffff"),
  { kind: "parking", name: "Free Parking", icon: "🅿️" },
  c("mx", "Mexico", 280, 6, "#006847", "#ce1126"), c("co", "Colombia", 280, 6, "#fcd116", "#003893"), chance(),
  c("ar", "Argentina", 300, 7, "#74acdf", "#f6b40e"), c("cl", "Chile", 300, 7, "#d52b1e", "#0039a6"),
  c("br", "Brazil", 320, 7, "#009c3b", "#ffdf00"),
  c("ca", "Canada", 340, 8, "#d52b1e", "#ffffff"), c("au", "Australia", 340, 8, "#00008b", "#e4002b"),
  c("es", "Spain", 360, 8, "#aa151b", "#f1bf00"),
  { kind: "gotojail", name: "Go To Jail", icon: "🚔" },
  c("de", "Germany", 380, 9, "#dd0000", "#ffce00"), c("fr", "France", 380, 9, "#0055a4", "#ef4135"), chance(),
  c("it", "Italy", 400, 10, "#009246", "#ce2b37"), c("gb", "United Kingdom", 400, 10, "#012169", "#c8102e"),
  c("jp", "Japan", 420, 10, "#bc002d", "#ffffff"),
  c("cn", "China", 440, 11, "#de2910", "#ffde00"), c("us", "USA", 460, 11, "#3c3b6e", "#b22234"),
  c("ru", "Russia", 480, 11, "#0039a6", "#d52b1e"),
];

export const groupSquares = (group: number): number[] =>
  BOARD.flatMap((s, i) => (s.kind === "country" && s.group === group ? [i] : []));

export const houseCost = (index: number): number => {
  const s = BOARD[index];
  return s.kind === "country" ? Math.max(10, Math.round(s.price / 20) * 10) : 0;
};

/** Rent multipliers over the base rent for 0 (no monopoly), 1-4 houses, hotel. */
export const RENT_BY_LEVEL = [1, 5, 12, 22, 32, 45];

// Colors players can choose from (each color can be used by one player only)
export const PLAYER_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#94a3b8",
];
const freeColor = (g: GameState) => PLAYER_COLORS.find((c) => !g.players.some((p) => p.color === c)) ?? PLAYER_COLORS[0];

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
  settings: Settings;
  hostId: string | null;
  players: Player[];
  owners: Record<number, string>; // square index -> player id
  houses: Record<number, number>; // square index -> build level (1-4 houses, 5 hotel)
  pot: number; // Free Parking jackpot
  turn: number; // index into players
  round: number; // completed rounds, drives rent inflation
  dice: [number, number] | null;
  canBuy: number | null; // square index offered for purchase
  extraRoll: boolean; // rolled doubles, rolls again after this action
  winnerId: string | null;
  turnDeadline: number | null; // epoch ms; set by the server when a turn timer is on
  log: string[];
};

export type Action =
  | { type: "JOIN"; name: string }
  | { type: "SET_PROFILE"; name?: string; color?: string }
  | { type: "SET_SETTINGS"; settings: Partial<Settings> }
  | { type: "ADD_BOT" }
  | { type: "START" }
  | { type: "ROLL" }
  | { type: "BUY" }
  | { type: "BUILD"; square: number }
  | { type: "SELL"; square: number }
  | { type: "END_TURN" };

export type Rng = () => number;

export const newGame = (code: string): GameState => ({
  code, phase: "lobby", settings: { ...DEFAULT_SETTINGS }, hostId: null, players: [], owners: {}, houses: {},
  pot: 0, turn: 0, round: 0, dice: null, canBuy: null, extraRoll: false, winnerId: null, turnDeadline: null, log: [],
});

const say = (g: GameState, msg: string) => {
  g.log.push(msg);
  if (g.log.length > 40) g.log.shift();
};
const alive = (g: GameState) => g.players.filter((p) => !p.bankrupt);
export const currentPlayer = (g: GameState) => g.players[g.turn];
const byId = (g: GameState, id: string) => g.players.find((p) => p.id === id);

export const ownsGroup = (g: GameState, playerId: string, group: number) =>
  groupSquares(group).every((i) => g.owners[i] === playerId);

export const level = (g: GameState, i: number) => g.houses[i] ?? 0;

/** Rents inflate over time so that every game eventually ends. */
export const INFLATION_EVERY = 3; // rounds per +15% rent
export const rentMultiplier = (g: GameState) =>
  g.settings.inflation ? 1.15 ** Math.floor(g.round / INFLATION_EVERY) : 1;

/** Rent for a given build level (ignores inflation), used by the UI rent table. */
export function baseRent(index: number, lvl: number, monopoly: boolean): number {
  const s = BOARD[index];
  if (s.kind !== "country") return 0;
  return lvl === 0 ? s.rent * (monopoly ? 2 : 1) : s.rent * RENT_BY_LEVEL[lvl];
}

export function rentFor(g: GameState, index: number): number {
  const s = BOARD[index];
  const owner = g.owners[index];
  if (s.kind !== "country" || !owner) return 0;
  const mono = ownsGroup(g, owner, s.group);
  return Math.round(baseRent(index, mono ? level(g, index) : 0, mono) * rentMultiplier(g));
}

/** Why `playerId` can't build on `index` right now (null = they can). */
export function buildError(g: GameState, playerId: string, index: number): string | null {
  const s = BOARD[index];
  if (!g.settings.buildings) return "Building is turned off in this room.";
  if (s?.kind !== "country") return "You can only build on countries.";
  if (g.owners[index] !== playerId) return "You don't own this country.";
  if (!ownsGroup(g, playerId, s.group)) return "You need every country in this color set first.";
  const lvl = level(g, index);
  if (lvl >= MAX_BUILD_LEVEL) return "Already has a hotel.";
  const min = Math.min(...groupSquares(s.group).map((i) => level(g, i)));
  if (lvl > min) return "Build evenly: upgrade your other countries in this set first.";
  const me = byId(g, playerId)!;
  if (me.money < houseCost(index)) return `You need $${houseCost(index)}.`;
  return null;
}

export function sellError(g: GameState, playerId: string, index: number): string | null {
  const s = BOARD[index];
  if (s?.kind !== "country" || g.owners[index] !== playerId) return "You don't own this country.";
  const lvl = level(g, index);
  if (lvl < 1) return "Nothing to sell here.";
  const max = Math.max(...groupSquares(s.group).map((i) => level(g, i)));
  if (lvl < max) return "Sell evenly: downgrade the highest country in this set first.";
  return null;
}

/** Pay `amount` from `from` to `to` (null = bank). Bankrupts `from` if they can't cover it. */
function pay(g: GameState, from: Player, to: Player | null, amount: number) {
  const toPot = !to && g.settings.freeParkingPot;
  if (from.money >= amount) {
    from.money -= amount;
    if (to) to.money += amount;
    else if (toPot) g.pot += amount;
    return;
  }
  if (to) to.money += from.money;
  from.money = 0;
  from.bankrupt = true;
  for (const [i, o] of Object.entries(g.owners)) {
    if (o === from.id) { delete g.owners[Number(i)]; delete g.houses[Number(i)]; }
  }
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
  const salary = salaryFor(g);
  if (collectGo && salary > 0) {
    p.money += salary;
    say(g, `${p.name} passed Go and collected $${salary}${salary === g.settings.bonusSalary && salary !== g.settings.goSalary ? " (bonus salary!)" : ""}.`);
  }
  p.pos = target;
}

function sendToJail(g: GameState, p: Player) {
  p.pos = JAIL_INDEX;
  p.jailed = true;
  g.extraRoll = false;
}

export const REPAIR_COUNTRY = 15;
export const REPAIR_HOUSE = 40;
export const REPAIR_HOTEL = 50;

/** What a player would owe for "property repairs": per country, per house, per hotel. */
export function repairBill(g: GameState, playerId: string): number {
  let total = 0;
  for (const [i, o] of Object.entries(g.owners)) {
    if (o !== playerId) continue;
    const lvl = level(g, Number(i));
    total += REPAIR_COUNTRY + (lvl === MAX_BUILD_LEVEL ? REPAIR_HOTEL : lvl * REPAIR_HOUSE);
  }
  return total;
}

// Chance deck: most cards pay out, some take money, some move you around.
type Card = (g: GameState, p: Player, rng: Rng) => void;
const gain = (amount: number, text: string): Card => (g, p) => {
  say(g, `❓ ${p.name}: ${text} Collect $${amount}.`);
  p.money += amount;
};
const collectFromEach = (amount: number, text: string): Card => (g, p) => {
  say(g, `❓ ${p.name}: ${text} Every player pays them $${amount}.`);
  for (const o of alive(g)) if (o.id !== p.id) pay(g, o, p, amount);
};
const lose = (amount: number, text: string): Card => (g, p) => {
  say(g, `❓ ${p.name}: ${text} Pay $${amount}.`);
  pay(g, p, null, amount);
};

const CHANCE_DECK: Card[] = [
  gain(150, "Tourism boom!"),
  gain(200, "You won the national lottery!"),
  gain(100, "Bank error in your favor."),
  gain(75, "Tax refund."),
  gain(250, "A distant relative left you an inheritance."),
  gain(120, "Your export business is booming."),
  collectFromEach(50, "It's your birthday!"),
  collectFromEach(30, "Charity gala: you are the guest of honor."),
  (g, p) => {
    say(g, `❓ ${p.name}: Advance to Go!`);
    moveTo(g, p, 0, true);
  },
  (g, p, rng) => {
    say(g, `❓ ${p.name}: Go back 3 squares.`);
    p.pos = (p.pos + BOARD.length - 3) % BOARD.length;
    landOn(g, p, rng, false);
  },
  (g, p) => {
    say(g, `❓ ${p.name}: Caught smuggling! Go to Jail.`);
    sendToJail(g, p);
  },
  lose(60, "Lost luggage."),
  lose(40, "Speeding fine."),
  (g, p) => {
    const bill = repairBill(g, p.id);
    if (bill === 0) say(g, `❓ ${p.name}: Property repairs, but you own nothing. Lucky!`);
    else {
      say(g, `❓ ${p.name}: Property repairs! $${REPAIR_COUNTRY}/country, $${REPAIR_HOUSE}/house, $${REPAIR_HOTEL}/hotel = $${bill}.`);
      pay(g, p, null, bill);
    }
  },
  (g, p) => {
    say(g, `❓ ${p.name}: Global tax day! Every player pays the bank $50.`);
    for (const o of alive(g)) pay(g, o, null, 50);
  },
];

function drawChance(g: GameState, p: Player, rng: Rng) {
  CHANCE_DECK[Math.floor(rng() * CHANCE_DECK.length)](g, p, rng);
}

function landOn(g: GameState, p: Player, rng: Rng, allowChance = true) {
  const s = BOARD[p.pos];
  switch (s.kind) {
    case "gotojail":
      say(g, `🚔 ${p.name} goes to Jail.`);
      sendToJail(g, p);
      break;
    case "parking":
      if (g.pot > 0) {
        say(g, `🅿️ ${p.name} collects $${g.pot} from Free Parking!`);
        p.money += g.pot;
        g.pot = 0;
      }
      break;
    case "chance":
      if (allowChance) drawChance(g, p, rng);
      break;
    case "country": {
      const ownerId = g.owners[p.pos];
      if (!ownerId) {
        if (p.money >= s.price) g.canBuy = p.pos;
        else say(g, `${p.name} landed on ${s.name} but can't afford $${s.price}.`);
      } else if (ownerId !== p.id) {
        const owner = byId(g, ownerId)!;
        const rent = rentFor(g, p.pos);
        say(g, `${p.name} pays $${rent} rent to ${owner.name} for ${s.name}.`);
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
    if (g.players.length >= g.settings.maxPlayers) return "Room is full.";
    const name = a.name.trim().slice(0, 16) || "Player";
    g.players.push({
      id: playerId, name, color: freeColor(g), money: g.settings.startMoney, pos: 0,
      jailed: false, bankrupt: false, connected: true, isBot: false,
    });
    g.hostId ??= playerId;
    say(g, `${name} joined.`);
    return null;
  }

  if (!me) return "You are not in this game.";
  const myTurn = g.phase !== "lobby" && g.phase !== "over" && currentPlayer(g).id === playerId && !me.bankrupt;

  switch (a.type) {
    case "SET_PROFILE": {
      if (g.phase !== "lobby") return "You can only change this before the game starts.";
      if (a.name !== undefined) {
        const name = String(a.name).trim().slice(0, 16);
        if (!name) return "Name can't be empty.";
        me.name = name;
      }
      if (a.color !== undefined) {
        if (!PLAYER_COLORS.includes(a.color)) return "Unknown color.";
        if (g.players.some((p) => p.id !== me.id && p.color === a.color)) return "That color is taken.";
        me.color = a.color;
      }
      return null;
    }
    case "SET_SETTINGS": {
      if (g.phase !== "lobby") return "Settings are locked once the game starts.";
      if (g.hostId !== playerId) return "Only the host can change settings.";
      const next = mergeSettings(g.settings, a.settings);
      if (typeof next === "string") return next;
      if (next.maxPlayers < g.players.length) return "Too many players already joined for that limit.";
      g.settings = next;
      return null;
    }
    case "ADD_BOT": {
      if (g.phase !== "lobby") return "Game already started.";
      if (g.hostId !== playerId) return "Only the host can add bots.";
      if (g.players.length >= g.settings.maxPlayers) return "Room is full.";
      const n = g.players.filter((p) => p.isBot).length + 1;
      g.players.push({
        id: `bot-${n}-${Math.floor(rng() * 1e6)}`, name: `Bot ${n}`, color: freeColor(g),
        money: g.settings.startMoney, pos: 0, jailed: false, bankrupt: false, connected: true, isBot: true,
      });
      return null;
    }
    case "START":
      if (g.phase !== "lobby") return "Game already started.";
      if (g.hostId !== playerId) return "Only the host can start.";
      if (g.players.length < MIN_PLAYERS) return "Need at least 2 players (add a bot!).";
      for (const p of g.players) p.money = g.settings.startMoney;
      g.phase = "roll";
      g.turn = 0;
      say(g, "🎲 Game started!");
      return null;
    case "ROLL": {
      if (g.phase !== "roll") return "You can't roll now.";
      if (!myTurn) return "Not your turn.";
      const d1 = 1 + Math.floor(rng() * 6), d2 = 1 + Math.floor(rng() * 6);
      g.dice = [d1, d2];
      const doubles = d1 === d2 && g.settings.doublesRoll;
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
      if (!myTurn) return "Not your turn.";
      const s = BOARD[g.canBuy];
      if (s.kind !== "country" || me.money < s.price) return "Can't afford that.";
      me.money -= s.price;
      g.owners[g.canBuy] = me.id;
      say(g, `${me.name} bought ${s.name} for $${s.price}.`);
      g.canBuy = null;
      return null;
    }
    case "BUILD": {
      if (!myTurn) return "You can only build on your own turn.";
      const idx = Number(a.square);
      const err = buildError(g, playerId, idx);
      if (err) return err;
      me.money -= houseCost(idx);
      g.houses[idx] = level(g, idx) + 1;
      say(g, `🏗️ ${me.name} built a ${g.houses[idx] === MAX_BUILD_LEVEL ? "hotel" : "house"} in ${BOARD[idx].name}.`);
      return null;
    }
    case "SELL": {
      if (!myTurn) return "You can only sell on your own turn.";
      const idx = Number(a.square);
      const err = sellError(g, playerId, idx);
      if (err) return err;
      g.houses[idx] = level(g, idx) - 1;
      if (g.houses[idx] === 0) delete g.houses[idx];
      me.money += Math.floor(houseCost(idx) / 2);
      say(g, `${me.name} sold a building in ${BOARD[idx].name}.`);
      return null;
    }
    case "END_TURN": {
      if (g.phase !== "action") return "Roll first.";
      if (!myTurn) return "Not your turn.";
      if (g.extraRoll && !me.jailed) {
        g.canBuy = null; g.dice = null; g.extraRoll = false; g.phase = "roll";
        say(g, `${me.name} rolls again.`);
      } else nextTurn(g);
      return null;
    }
  }
}

/** Simple auto-player brain for bots and disconnected players. */
export function botAction(g: GameState, force = false): Action | null {
  const p = currentPlayer(g);
  if (!p || p.bankrupt || !(force || p.isBot || !p.connected)) return null;
  if (g.phase === "roll") return { type: "ROLL" };
  if (g.phase === "action") {
    if (g.canBuy !== null) {
      const s = BOARD[g.canBuy];
      if (s.kind === "country" && p.money - s.price >= 150) return { type: "BUY" };
    }
    for (let i = 0; i < BOARD.length; i++) {
      if (g.owners[i] === p.id && houseCost(i) > 0 && p.money - houseCost(i) >= 250 && !buildError(g, p.id, i)) {
        return { type: "BUILD", square: i };
      }
    }
    return { type: "END_TURN" };
  }
  return null;
}
