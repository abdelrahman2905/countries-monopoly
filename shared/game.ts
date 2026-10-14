// Pure, server-authoritative game engine. Used by the PartyKit server;
// the client only imports the types and the BOARD data for rendering.

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
  auctions: boolean; // a player who lands on a free country may auction it instead of buying
  loans: boolean; // players may borrow from the bank and must repay within LOAN_ROUNDS rounds
  loanInterest: number; // percent added to the borrowed amount
  teamMode: boolean; // teams (up to 4) on a double-size map with twice the countries
  teamCount: number; // number of teams in team mode
};

export const DEFAULT_SETTINGS: Settings = {
  startMoney: 1500, goSalary: 300, bonusAfterRounds: 5, bonusSalary: 1000, turnTimer: 90, maxPlayers: 6,
  buildings: true, inflation: true, doublesRoll: true, freeParkingPot: false,
  auctions: true, loans: false, loanInterest: 10, teamMode: false, teamCount: 2,
};

export const LOAN_ROUNDS = 5;
export const LOAN_OPTIONS = [200, 500, 1000, 2000] as const;
export const BID_INCREMENTS = [2, 5, 50] as const;
export const AUCTION_FIRST_SECONDS = 15; // time to place a first bid
export const AUCTION_BID_SECONDS = 8; // the auction ends this long after the last bid

export const SETTING_OPTIONS = {
  startMoney: [1000, 1500, 2000, 3000, 5000],
  goSalary: [0, 100, 200, 300, 500],
  bonusAfterRounds: [0, 3, 5, 8, 10],
  bonusSalary: [500, 1000, 1500, 2000],
  turnTimer: [0, 30, 60, 90, 120],
  maxPlayers: [2, 3, 4, 5, 6, 8],
  loanInterest: [0, 10, 20],
  teamCount: [2, 3, 4],
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

// ---------- Big board for team mode: 80 squares, 64 countries in 24 color sets ----------
// Extra countries beyond the classic 32: [name, flag color 1, flag color 2]
const EXTRA: Record<string, [string, string, string]> = {
  et: ["Ethiopia", "#078930", "#fcdd09"], tz: ["Tanzania", "#1eb53a", "#00a3dd"], za: ["South Africa", "#007a4d", "#ffb612"],
  gh: ["Ghana", "#006b3f", "#fcd116"], ao: ["Angola", "#cc092f", "#000000"], ly: ["Libya", "#239e46", "#e70013"],
  sd: ["Sudan", "#d21034", "#007229"], zm: ["Zambia", "#198a00", "#de2010"], mz: ["Mozambique", "#007168", "#fce100"],
  mm: ["Myanmar", "#fecb00", "#34b233"], kz: ["Kazakhstan", "#00afca", "#fec50c"], mn: ["Mongolia", "#c4272f", "#015197"],
  af: ["Afghanistan", "#d32011", "#009a00"], my: ["Malaysia", "#cc0001", "#010066"], kr: ["South Korea", "#cd2e3a", "#0047a0"],
  np: ["Nepal", "#dc143c", "#003893"], uz: ["Uzbekistan", "#1eb53a", "#0099b5"], iq: ["Iraq", "#ce1126", "#007a3d"],
  ua: ["Ukraine", "#0057b7", "#ffd700"], se: ["Sweden", "#006aa7", "#fecc00"], no: ["Norway", "#ba0c2f", "#00205b"],
  fi: ["Finland", "#003580", "#ffffff"], pt: ["Portugal", "#006600", "#ff0000"], ro: ["Romania", "#002b7f", "#fcd116"],
  ie: ["Ireland", "#169b62", "#ff883e"], pe: ["Peru", "#d91023", "#ffffff"], ve: ["Venezuela", "#fcd116", "#cf142b"],
  bo: ["Bolivia", "#d52b1e", "#007934"], cu: ["Cuba", "#002a8f", "#cf142b"], ec: ["Ecuador", "#ffd100", "#034ea2"],
  nz: ["New Zealand", "#00247d", "#cc142b"], pg: ["Papua New Guinea", "#ce1126", "#fcd116"],
};

// Each side: six color sets of 2, 3, 3, 3, 3, 2 countries, cheapest side first
const BIG_SIDES: string[][][] = [
  [["et", "ng"], ["ke", "tz", "mz"], ["bd", "pk", "mm"], ["eg", "ma", "dz"], ["gh", "ao", "zm"], ["np", "af"]],
  [["vn", "th"], ["id", "my", "mn"], ["in", "ir", "iq"], ["sa", "tr", "ly"], ["sd", "za", "kz"], ["uz", "gr"]],
  [["pl", "ua"], ["ro", "pt", "ie"], ["mx", "co", "pe"], ["ve", "bo", "ec"], ["ar", "cl", "cu"], ["br", "nz"]],
  [["pg", "kr"], ["es", "fi", "no"], ["se", "au", "ca"], ["de", "fr", "it"], ["gb", "jp", "ru"], ["cn", "us"]],
];

function buildBigBoard(): Square[] {
  const known = new Map<string, { name: string; colors: [string, string] }>();
  for (const s of BOARD) if (s.kind === "country") known.set(s.iso, { name: s.name, colors: s.colors });
  for (const [iso, [name, c1, c2]] of Object.entries(EXTRA)) known.set(iso, { name, colors: [c1, c2] });

  const corners: Square[] = [
    { kind: "jail", name: "Jail", icon: "🔒" },
    { kind: "parking", name: "Free Parking", icon: "🅿️" },
    { kind: "gotojail", name: "Go To Jail", icon: "🚔" },
  ];
  const out: Square[] = [{ kind: "go", name: "Go", icon: "🏁" }];
  let k = 0;
  let group = 0;
  BIG_SIDES.forEach((side, s) => {
    side.forEach((isos, gi) => {
      for (const iso of isos) {
        const info = known.get(iso);
        if (!info) throw new Error(`missing country ${iso}`);
        out.push(c(iso, info.name, 10 * Math.round((50 + 11 * k++) / 10), group, info.colors[0], info.colors[1]));
      }
      group++;
      if (gi === 0 || gi === 2 || gi === 4) out.push(chance());
    });
    if (s < 3) out.push(corners[s]);
  });
  return out;
}

export const BIG_BOARD: Square[] = buildBigBoard();

/** The board this game is played on. */
export const boardOf = (g: { settings: Pick<Settings, "teamMode"> }): Square[] => (g.settings.teamMode ? BIG_BOARD : BOARD);
const B = boardOf;
export const jailIndex = (board: Square[]): number => board.findIndex((s) => s.kind === "jail");
/** Side length of the square board in tiles (10 for the classic board, 20 for the big one). */
export const sideLength = (board: Square[]): number => board.length / 4;

/** Color of a color set (the big board has 24 sets, so its colors are generated). */
export const groupColor = (board: Square[], group: number): string =>
  board === BIG_BOARD ? `hsl(${(group * 47) % 360} ${60 + (group % 3) * 10}% ${42 + (group % 2) * 10}%)` : GROUP_COLORS[group];

export const groupSquares = (board: Square[], group: number): number[] =>
  board.flatMap((s, i) => (s.kind === "country" && s.group === group ? [i] : []));

export const houseCost = (board: Square[], index: number): number => {
  const s = board[index];
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
  team: number; // team index (only meaningful in team mode)
};

// Teams in team mode (up to 4)
export const TEAMS = [
  { name: "Red", color: "#ef4444", icon: "🔴" },
  { name: "Blue", color: "#3b82f6", icon: "🔵" },
  { name: "Green", color: "#22c55e", icon: "🟢" },
  { name: "Gold", color: "#eab308", icon: "🟡" },
];
export const GIVE_AMOUNTS = [50, 100, 500] as const;

// "auction": everyone bids on a free country; "sell": a player with an overdue loan must sell a country to the bank
// "claim": a player drew the free-country Chance card and must pick their country
export type Phase = "lobby" | "roll" | "action" | "auction" | "sell" | "claim" | "over";

export type Loan = { debt: number; due: number }; // debt owed to the bank; due = round by which it must be repaid
/** A deal offered by `from` to `to`: `from` gives `give` (+ money) and takes `take` (+ money). */
export type Trade = {
  id: number;
  from: string;
  to: string;
  give: number[]; // squares `from` hands over
  take: number[]; // squares `from` asks for
  giveMoney: number;
  takeMoney: number;
};
export type Auction = { square: number; bid: number; bidderId: string | null; deadline: number | null };

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
  rollCount: number; // increments on every roll (lets the UI animate each roll)
  loans: Record<string, Loan>; // player id -> loan
  auction: Auction | null;
  trades: Trade[]; // pending deals between players
  nextTradeId: number;
  freeCountryUsed: boolean; // the free-country Chance card can only be drawn once per game
  dice: [number, number] | null;
  canBuy: number | null; // square index offered for purchase
  extraRoll: boolean; // rolled doubles, rolls again after this action
  winnerId: string | null;
  winnerTeam: number | null; // team mode: the winning team
  turnDeadline: number | null; // epoch ms; set by the server when a turn timer is on
  log: string[];
};

export type Action =
  | { type: "JOIN"; name: string }
  | { type: "SET_PROFILE"; name?: string; color?: string; team?: number }
  | { type: "GIVE"; to: string; amount: number }
  | { type: "SET_SETTINGS"; settings: Partial<Settings> }
  | { type: "ADD_BOT" }
  | { type: "START" }
  | { type: "ROLL" }
  | { type: "BUY" }
  | { type: "AUCTION" }
  | { type: "BID"; inc: number }
  | { type: "PROPOSE_TRADE"; to: string; give: number[]; take: number[]; giveMoney: number; takeMoney: number }
  | { type: "ACCEPT_TRADE"; id: number }
  | { type: "CANCEL_TRADE"; id: number }
  | { type: "CLAIM"; square: number }
  | { type: "TAKE_LOAN"; amount: number }
  | { type: "REPAY" }
  | { type: "SELL_COUNTRY"; square: number }
  | { type: "BUILD"; square: number }
  | { type: "SELL"; square: number }
  | { type: "END_TURN" };

export type Rng = () => number;

export const newGame = (code: string): GameState => ({
  code, phase: "lobby", settings: { ...DEFAULT_SETTINGS }, hostId: null, players: [], owners: {}, houses: {},
  pot: 0, turn: 0, round: 0, rollCount: 0, loans: {}, auction: null, trades: [], nextTradeId: 1, freeCountryUsed: false, dice: null, canBuy: null, extraRoll: false, winnerId: null, winnerTeam: null, turnDeadline: null, log: [],
});

export const teamMembers = (g: GameState, team: number) => g.players.filter((p) => p.team === team);
/** True when `a` and `b` are the same player, or teammates in team mode. */
export const sameSide = (g: GameState, a: string, b: string): boolean => {
  if (a === b) return true;
  if (!g.settings.teamMode) return false;
  const pa = g.players.find((p) => p.id === a), pb = g.players.find((p) => p.id === b);
  return !!pa && !!pb && pa.team === pb.team;
};
const smallestTeam = (g: GameState): number => {
  const counts = Array.from({ length: g.settings.teamCount }, (_, t) => teamMembers(g, t).length);
  return counts.indexOf(Math.min(...counts));
};

const say = (g: GameState, msg: string) => {
  g.log.push(msg);
  if (g.log.length > 40) g.log.shift();
};
const alive = (g: GameState) => g.players.filter((p) => !p.bankrupt);
export const currentPlayer = (g: GameState) => g.players[g.turn];
const byId = (g: GameState, id: string) => g.players.find((p) => p.id === id);

export const ownsGroup = (g: GameState, playerId: string, group: number) =>
  groupSquares(B(g), group).every((i) => {
    const o = g.owners[i];
    return !!o && sameSide(g, o, playerId); // in team mode a set owned by teammates together counts
  });

export const level = (g: GameState, i: number) => g.houses[i] ?? 0;

/** Rents inflate over time so that every game eventually ends. */
export const INFLATION_EVERY = 3; // rounds per +15% rent
export const rentMultiplier = (g: GameState) =>
  g.settings.inflation ? 1.15 ** Math.floor(g.round / INFLATION_EVERY) : 1;

/** Rent for a given build level (ignores inflation), used by the UI rent table. */
export function baseRent(board: Square[], index: number, lvl: number, monopoly: boolean): number {
  const s = board[index];
  if (s.kind !== "country") return 0;
  return lvl === 0 ? s.rent * (monopoly ? 2 : 1) : s.rent * RENT_BY_LEVEL[lvl];
}

export function rentFor(g: GameState, index: number): number {
  const s = B(g)[index];
  const owner = g.owners[index];
  if (s.kind !== "country" || !owner) return 0;
  const mono = ownsGroup(g, owner, s.group);
  return Math.round(baseRent(B(g), index, mono ? level(g, index) : 0, mono) * rentMultiplier(g));
}

/** Why `playerId` can't build on `index` right now (null = they can). */
export function buildError(g: GameState, playerId: string, index: number): string | null {
  const s = B(g)[index];
  if (!g.settings.buildings) return "Building is turned off in this room.";
  if (s?.kind !== "country") return "You can only build on countries.";
  if (g.owners[index] !== playerId) return "You don't own this country.";
  if (!ownsGroup(g, playerId, s.group)) return "You need every country in this color set first.";
  const lvl = level(g, index);
  if (lvl >= MAX_BUILD_LEVEL) return "Already has a hotel.";
  const min = Math.min(...groupSquares(B(g), s.group).map((i) => level(g, i)));
  if (lvl > min) return "Build evenly: upgrade your other countries in this set first.";
  const me = byId(g, playerId)!;
  if (me.money < houseCost(B(g), index)) return `You need $${houseCost(B(g), index)}.`;
  return null;
}

export function sellError(g: GameState, playerId: string, index: number): string | null {
  const s = B(g)[index];
  if (s?.kind !== "country" || g.owners[index] !== playerId) return "You don't own this country.";
  const lvl = level(g, index);
  if (lvl < 1) return "Nothing to sell here.";
  const max = Math.max(...groupSquares(B(g), s.group).map((i) => level(g, i)));
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
  delete g.loans[from.id];
  for (const [i, o] of Object.entries(g.owners)) {
    if (o === from.id) { delete g.owners[Number(i)]; delete g.houses[Number(i)]; }
  }
  say(g, `💥 ${from.name} can't pay $${amount} and is bankrupt!`);
}

function checkWinner(g: GameState) {
  const left = alive(g);
  if (g.phase === "lobby" || g.phase === "over") return;
  if (g.settings.teamMode) {
    const teams = new Set(left.map((p) => p.team));
    if (teams.size === 1 && left.length > 0) {
      const t = left[0].team;
      g.phase = "over";
      g.winnerTeam = t;
      g.winnerId = left[0].id;
      g.canBuy = null;
      g.auction = null;
      say(g, `🏆 Team ${TEAMS[t].name} wins the game!`);
    }
  } else if (left.length === 1) {
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
  p.pos = jailIndex(B(g));
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
  say(g, `❓ ${p.name}: ${text} Every opponent pays them $${amount}.`);
  for (const o of alive(g)) if (!sameSide(g, o.id, p.id)) pay(g, o, p, amount);
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
    p.pos = (p.pos + B(g).length - 3) % B(g).length;
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
  // the rare one: take any free country (only once per game)
  (g, p) => {
    g.freeCountryUsed = true;
    g.phase = "claim";
    say(g, `🎁 ${p.name} drew "Free country": they may take any free country, for free!`);
  },
];
export const FREE_COUNTRY_CARD = CHANCE_DECK.length - 1;
export const CHANCE_DECK_SIZE = CHANCE_DECK.length;

/** Free countries `playerId` may claim: unowned, in a color set where they own nothing yet. */
export function claimableSquares(g: GameState, playerId: string): number[] {
  const board = B(g);
  return board.flatMap((s, i) => {
    if (s.kind !== "country" || g.owners[i]) return [];
    const ownsInGroup = groupSquares(board, s.group).some((x) => g.owners[x] === playerId);
    return ownsInGroup ? [] : [i];
  });
}

function drawChance(g: GameState, p: Player, rng: Rng) {
  let i = Math.floor(rng() * CHANCE_DECK.length);
  // the free-country card is skipped if it was already drawn or nothing qualifies
  if (i === FREE_COUNTRY_CARD && (g.freeCountryUsed || claimableSquares(g, p.id).length === 0)) i = Math.floor(rng() * FREE_COUNTRY_CARD);
  CHANCE_DECK[i](g, p, rng);
}

// ---------- Trading ----------
export const MAX_TRADE_SQUARES = 12;

/** Why this deal is invalid right now (null = fine). Money is checked separately when accepting. */
export function tradeError(g: GameState, t: Trade): string | null {
  const from = byId(g, t.from), to = byId(g, t.to);
  if (!from || !to || from.id === to.id) return "Pick another player.";
  if (from.bankrupt || to.bankrupt) return "That player is out of the game.";
  const board = B(g);
  const okSquares = (list: number[], owner: string) =>
    list.length <= MAX_TRADE_SQUARES &&
    new Set(list).size === list.length &&
    list.every((i) => Number.isInteger(i) && board[i]?.kind === "country" && g.owners[i] === owner && level(g, i) === 0);
  if (!okSquares(t.give, from.id)) return "You can only offer your own countries without houses or hotels.";
  if (!okSquares(t.take, to.id)) return "They no longer own those countries (or they have buildings on them).";
  for (const m of [t.giveMoney, t.takeMoney]) if (!Number.isInteger(m) || m < 0 || m > 1_000_000) return "Invalid amount of money.";
  if (!t.give.length && !t.take.length && !t.giveMoney && !t.takeMoney) return "The deal is empty.";
  return null;
}

const pruneTrades = (g: GameState) => {
  g.trades = g.phase === "lobby" || g.phase === "over" ? [] : g.trades.filter((t) => tradeError(g, t) === null);
};

/** A bot's answer to deals offered to it: accept if it gets clearly more value than it gives. */
export function resolveBotTrades(g: GameState, rng: Rng = Math.random) {
  const board = B(g);
  const value = (list: number[]) => list.reduce((sum, i) => sum + (board[i]?.kind === "country" ? board[i].price : 0), 0);
  for (const t of [...g.trades]) {
    const bot = byId(g, t.to);
    if (!bot?.isBot) continue;
    const gets = value(t.give) + t.giveMoney;
    const loses = value(t.take) + t.takeMoney;
    const accept = gets >= loses * 1.15 && bot.money - t.takeMoney >= 100;
    apply(g, bot.id, accept ? { type: "ACCEPT_TRADE", id: t.id } : { type: "CANCEL_TRADE", id: t.id }, rng);
  }
}

function landOn(g: GameState, p: Player, rng: Rng, allowChance = true) {
  const s = B(g)[p.pos];
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
      } else if (ownerId !== p.id && sameSide(g, ownerId, p.id)) {
        say(g, `🤝 ${p.name} stays free on ${s.name}: it belongs to teammate ${byId(g, ownerId)!.name}.`);
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
  const start = g.turn;
  for (let i = 1; i <= n * 2; i++) {
    if (Math.floor((start + i) / n) > Math.floor((start + i - 1) / n)) g.round++; // passed the last seat: new round
    const p = g.players[(start + i) % n];
    if (p.bankrupt) continue;
    g.turn = (start + i) % n;
    if (p.jailed) {
      p.jailed = false;
      say(g, `🔒 ${p.name} is released from Jail but skips this turn.`);
      continue;
    }
    // overdue bank loan: the bank collects cash if the player has it, otherwise they must sell a country
    const loan = g.loans[p.id];
    if (loan && g.round >= loan.due) {
      say(g, `🏦 ${p.name}'s loan of $${loan.debt} is overdue!`);
      if (collectDebt(g, p)) { g.phase = "sell"; return; }
      if (p.bankrupt) continue;
    }
    g.phase = "roll";
    return;
  }
}

/**
 * Settle an overdue loan from cash where possible. Returns true if the player still has to
 * choose a country to sell to the bank; false if the debt is gone (paid, or they went bankrupt).
 */
function collectDebt(g: GameState, p: Player): boolean {
  const loan = g.loans[p.id];
  if (!loan) return false;
  if (p.money >= loan.debt) {
    p.money -= loan.debt;
    delete g.loans[p.id];
    say(g, `🏦 The bank collected $${loan.debt} from ${p.name}.`);
    return false;
  }
  const owned = Object.keys(g.owners).some((i) => g.owners[Number(i)] === p.id);
  if (!owned) {
    pay(g, p, null, loan.debt); // nothing left to sell: bankrupt
    return false;
  }
  return true;
}

/** Value the bank pays when a player sells a country to it: its price plus half the building costs. */
export const bankBuyPrice = (g: GameState, index: number): number => {
  const s = B(g)[index];
  return s.kind === "country" ? s.price + Math.floor(houseCost(B(g), index) / 2) * level(g, index) : 0;
};

/** Ends the auction: the highest bidder pays and gets the country (no bids = it stays unowned). */
export function finishAuction(g: GameState) {
  const a = g.auction;
  if (!a) return;
  const s = B(g)[a.square];
  const winner = a.bidderId ? byId(g, a.bidderId) : undefined;
  if (winner && s.kind === "country" && winner.money >= a.bid) {
    winner.money -= a.bid;
    g.owners[a.square] = winner.id;
    say(g, `🔨 ${winner.name} won the auction for ${s.name} at $${a.bid}!`);
  } else {
    say(g, `🔨 Nobody bid for ${s.name}. It stays with the bank.`);
  }
  g.auction = null;
  g.phase = "action";
}

/** Which bot (if any) should raise the auction right now, and by how much. */
export function botAuctionBid(g: GameState, rng: Rng): { playerId: string; inc: number } | null {
  const a = g.auction;
  const s = a ? B(g)[a.square] : null;
  if (!a || s?.kind !== "country") return null;
  const limit = Math.floor(s.price * 0.85); // bots never bid more than 85% of the price
  const candidates = g.players.filter((p) => p.isBot && !p.bankrupt && p.id !== a.bidderId);
  while (candidates.length) {
    const p = candidates.splice(Math.floor(rng() * candidates.length), 1)[0];
    const inc = [...BID_INCREMENTS].reverse().find((x) => a.bid + x <= limit && p.money >= a.bid + x + 100);
    if (inc && rng() < 0.6) return { playerId: p.id, inc };
  }
  return null;
}

/** Apply a player's action. Returns an error string if the action is illegal. */
export function apply(g: GameState, playerId: string, a: Action, rng: Rng = Math.random): string | null {
  const err = applyInner(g, playerId, a, rng);
  if (!err && (g.phase === "action" || g.phase === "sell") && currentPlayer(g).bankrupt) {
    // went bust mid-turn: nothing left to do, move on
    checkWinner(g);
    if (!g.winnerId) nextTurn(g);
  }
  if (!err) checkWinner(g);
  pruneTrades(g);
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
      jailed: false, bankrupt: false, connected: true, isBot: false, team: smallestTeam(g),
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
      if (a.team !== undefined) {
        if (!g.settings.teamMode) return "Teams are not enabled in this room.";
        if (!Number.isInteger(a.team) || a.team < 0 || a.team >= g.settings.teamCount) return "Unknown team.";
        me.team = a.team;
      }
      return null;
    }
    case "GIVE": {
      // teammates can send each other money at any time during the game
      if (!g.settings.teamMode) return "Teams are not enabled in this room.";
      if (g.phase === "lobby" || g.phase === "over") return "The game is not running.";
      const to = byId(g, a.to);
      if (!to || to.id === me.id || to.team !== me.team || to.bankrupt) return "You can only give money to a teammate.";
      if (me.bankrupt) return "You are out of the game.";
      if (!(GIVE_AMOUNTS as readonly number[]).includes(a.amount)) return "Invalid amount.";
      if (me.money < a.amount) return "Not enough money.";
      me.money -= a.amount;
      to.money += a.amount;
      say(g, `🤝 ${me.name} gave $${a.amount} to teammate ${to.name}.`);
      return null;
    }
    case "SET_SETTINGS": {
      if (g.phase !== "lobby") return "Settings are locked once the game starts.";
      if (g.hostId !== playerId) return "Only the host can change settings.";
      const next = mergeSettings(g.settings, a.settings);
      if (typeof next === "string") return next;
      if (next.maxPlayers < g.players.length) return "Too many players already joined for that limit.";
      g.settings = next;
      // fewer teams than before: move players from removed teams to the smallest remaining ones
      for (const p of g.players) if (p.team >= next.teamCount) p.team = smallestTeam(g);
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
        team: smallestTeam(g),
      });
      return null;
    }
    case "START":
      if (g.phase !== "lobby") return "Game already started.";
      if (g.hostId !== playerId) return "Only the host can start.";
      if (g.players.length < MIN_PLAYERS) return "Need at least 2 players (add a bot!).";
      if (g.settings.teamMode) {
        if (new Set(g.players.map((p) => p.team)).size < 2) return "Team mode needs players on at least 2 teams.";
        // turns alternate between teams: team 1 player, team 2 player, ..., then the next player of each team
        const byTeam = Array.from({ length: g.settings.teamCount }, (_, t) => teamMembers(g, t));
        const order: Player[] = [];
        for (let i = 0; order.length < g.players.length; i++) for (const team of byTeam) if (team[i]) order.push(team[i]);
        g.players = order;
      }
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
      g.rollCount++;
      const doubles = d1 === d2 && g.settings.doublesRoll;
      say(g, `${me.name} rolled ${d1} + ${d2}${doubles ? " (doubles!)" : ""}.`);
      g.extraRoll = doubles;
      const raw = me.pos + d1 + d2;
      moveTo(g, me, raw % B(g).length, raw >= B(g).length);
      landOn(g, me, rng);
      if ((g as GameState).phase !== "claim") g.phase = "action";
      checkWinner(g);
      return null;
    }
    case "BUY": {
      if (g.phase !== "action" || g.canBuy === null) return "Nothing to buy.";
      if (!myTurn) return "Not your turn.";
      const s = B(g)[g.canBuy];
      if (s.kind !== "country" || me.money < s.price) return "Can't afford that.";
      me.money -= s.price;
      g.owners[g.canBuy] = me.id;
      say(g, `${me.name} bought ${s.name} for $${s.price}.`);
      g.canBuy = null;
      return null;
    }
    case "AUCTION": {
      if (!g.settings.auctions) return "Auctions are turned off in this room.";
      if (g.phase !== "action" || g.canBuy === null) return "Nothing to auction.";
      if (!myTurn) return "Not your turn.";
      const s = B(g)[g.canBuy];
      if (s.kind !== "country") return "Nothing to auction.";
      g.auction = { square: g.canBuy, bid: Math.max(10, Math.round(s.price / 10)), bidderId: null, deadline: null };
      g.canBuy = null;
      g.phase = "auction";
      say(g, `🔨 ${me.name} puts ${s.name} up for auction! Starting bid $${g.auction.bid}.`);
      return null;
    }
    case "BID": {
      const au = g.auction;
      if (g.phase !== "auction" || !au) return "There is no auction right now.";
      if (me.bankrupt) return "You are out of the game.";
      if (!(BID_INCREMENTS as readonly number[]).includes(a.inc)) return "Invalid bid.";
      if (au.bidderId === me.id) return "You already have the highest bid.";
      const next = au.bid + a.inc;
      if (me.money < next) return `You need $${next} to bid.`;
      au.bid = next;
      au.bidderId = me.id;
      return null;
    }
    case "TAKE_LOAN": {
      if (!g.settings.loans) return "Bank loans are turned off in this room.";
      if (!myTurn || (g.phase !== "roll" && g.phase !== "action")) return "You can borrow on your own turn.";
      if (g.loans[me.id]) return "Repay your current loan first.";
      if (!(LOAN_OPTIONS as readonly number[]).includes(a.amount)) return "Invalid loan amount.";
      const debt = Math.round(a.amount * (1 + g.settings.loanInterest / 100));
      me.money += a.amount;
      g.loans[me.id] = { debt, due: g.round + LOAN_ROUNDS };
      say(g, `🏦 ${me.name} borrowed $${a.amount} from the bank and owes $${debt} within ${LOAN_ROUNDS} rounds.`);
      return null;
    }
    case "REPAY": {
      const loan = g.loans[me.id];
      if (!loan) return "You have no loan.";
      if (!myTurn || (g.phase !== "roll" && g.phase !== "action" && g.phase !== "sell")) return "You can repay on your own turn.";
      if (me.money < loan.debt) return `You need $${loan.debt} to repay.`;
      me.money -= loan.debt;
      delete g.loans[me.id];
      say(g, `🏦 ${me.name} repaid the bank $${loan.debt}.`);
      if (g.phase === "sell") g.phase = "roll";
      return null;
    }
    case "SELL_COUNTRY": {
      const loan = g.loans[me.id];
      if (g.phase !== "sell" || !loan || !myTurn) return "You don't have to sell anything.";
      const idx = Number(a.square);
      const s = B(g)[idx];
      if (s?.kind !== "country" || g.owners[idx] !== me.id) return "You don't own that country.";
      const value = bankBuyPrice(g, idx);
      delete g.owners[idx];
      delete g.houses[idx];
      loan.debt -= value;
      say(g, `🏦 ${me.name} sold ${s.name} to the bank for $${value} to pay the debt.`);
      if (loan.debt <= 0) {
        me.money += -loan.debt; // the bank pays back any surplus
        delete g.loans[me.id];
      } else if (collectDebt(g, me)) {
        return null; // still owes the bank: sell another country
      }
      if (!me.bankrupt) g.phase = "roll";
      return null;
    }
    case "CLAIM": {
      if (g.phase !== "claim" || !myTurn) return "You can't claim a country now.";
      const idx = Number(a.square);
      if (!claimableSquares(g, me.id).includes(idx)) return "Pick a free country in a color set where you own nothing yet.";
      const s = B(g)[idx];
      g.owners[idx] = me.id;
      g.phase = "action";
      say(g, `🎁 ${me.name} took ${s.name} for free!`);
      return null;
    }
    case "PROPOSE_TRADE": {
      if (g.phase !== "roll" && g.phase !== "action") return "You can trade when no auction or special choice is running.";
      if (me.bankrupt) return "You are out of the game.";
      const num = (n: unknown) => (typeof n === "number" ? n : NaN);
      const list = (l: unknown) => (Array.isArray(l) ? l.map(num) : []);
      const trade: Trade = {
        id: g.nextTradeId, from: me.id, to: String(a.to),
        give: list(a.give), take: list(a.take), giveMoney: num(a.giveMoney), takeMoney: num(a.takeMoney),
      };
      const err = tradeError(g, trade);
      if (err) return err;
      if (me.money < trade.giveMoney) return "You don't have that much money.";
      g.trades = g.trades.filter((x) => x.from !== me.id); // one open offer per player
      g.nextTradeId++;
      g.trades.push(trade);
      say(g, `🤝 ${me.name} offered a deal to ${byId(g, trade.to)!.name}.`);
      return null;
    }
    case "ACCEPT_TRADE": {
      const tr = g.trades.find((x) => x.id === a.id);
      if (!tr || tr.to !== me.id) return "That deal is no longer available.";
      if (g.phase !== "roll" && g.phase !== "action") return "You can accept deals when no auction or special choice is running.";
      const err = tradeError(g, tr);
      if (err) return err;
      const from = byId(g, tr.from)!;
      if (from.money < tr.giveMoney) return `${from.name} no longer has that money.`;
      if (me.money < tr.takeMoney) return "You don't have enough money for this deal.";
      for (const i of tr.give) g.owners[i] = me.id;
      for (const i of tr.take) g.owners[i] = from.id;
      from.money += tr.takeMoney - tr.giveMoney;
      me.money += tr.giveMoney - tr.takeMoney;
      g.trades = g.trades.filter((x) => x.id !== tr.id);
      const names = (l: number[]) => (l.length ? l.map((i) => B(g)[i].name).join(", ") : "nothing");
      say(g, `🤝 Deal! ${from.name} gives ${names(tr.give)}${tr.giveMoney ? ` + $${tr.giveMoney}` : ""} and gets ${names(tr.take)}${tr.takeMoney ? ` + $${tr.takeMoney}` : ""} from ${me.name}.`);
      return null;
    }
    case "CANCEL_TRADE": {
      const tr = g.trades.find((x) => x.id === a.id);
      if (!tr || (tr.from !== me.id && tr.to !== me.id)) return "That deal is no longer available.";
      g.trades = g.trades.filter((x) => x.id !== tr.id);
      say(g, `🤝 ${tr.from === me.id ? "The offer was withdrawn" : `${me.name} declined the deal`}.`);
      return null;
    }
    case "BUILD": {
      if (!myTurn || (g.phase !== "roll" && g.phase !== "action")) return "You can only build on your own turn.";
      const idx = Number(a.square);
      const err = buildError(g, playerId, idx);
      if (err) return err;
      me.money -= houseCost(B(g), idx);
      g.houses[idx] = level(g, idx) + 1;
      say(g, `🏗️ ${me.name} built a ${g.houses[idx] === MAX_BUILD_LEVEL ? "hotel" : "house"} in ${B(g)[idx].name}.`);
      return null;
    }
    case "SELL": {
      if (!myTurn || (g.phase !== "roll" && g.phase !== "action")) return "You can only sell on your own turn.";
      const idx = Number(a.square);
      const err = sellError(g, playerId, idx);
      if (err) return err;
      g.houses[idx] = level(g, idx) - 1;
      if (g.houses[idx] === 0) delete g.houses[idx];
      me.money += Math.floor(houseCost(B(g), idx) / 2);
      say(g, `${me.name} sold a building in ${B(g)[idx].name}.`);
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
  const loan = g.loans[p.id];
  if (g.phase === "sell") {
    if (loan && p.money >= loan.debt) return { type: "REPAY" };
    // sell the cheapest country that covers the whole debt, otherwise the most valuable one
    const owned = B(g).flatMap((s, i) => (g.owners[i] === p.id ? [i] : []));
    const covering = owned.filter((i) => loan && bankBuyPrice(g, i) >= loan.debt).sort((x, y) => bankBuyPrice(g, x) - bankBuyPrice(g, y));
    const pick = covering[0] ?? owned.sort((x, y) => bankBuyPrice(g, y) - bankBuyPrice(g, x))[0];
    return pick === undefined ? null : { type: "SELL_COUNTRY", square: pick };
  }
  if (g.phase === "claim") {
    const board = B(g);
    const best = claimableSquares(g, p.id).sort((x, y) => {
      const a = board[x], b = board[y];
      return (b.kind === "country" ? b.price : 0) - (a.kind === "country" ? a.price : 0);
    })[0];
    return best === undefined ? null : { type: "CLAIM", square: best };
  }
  if (g.phase === "roll") return { type: "ROLL" };
  if (g.phase === "action") {
    if (loan && p.money >= loan.debt + 400) return { type: "REPAY" };
    if (g.settings.loans && !loan && p.money < 150 && g.canBuy === null && g.round < 40) return { type: "TAKE_LOAN", amount: 500 };
    if (g.canBuy !== null) {
      const s = B(g)[g.canBuy];
      if (s.kind === "country" && p.money - s.price >= 150) return { type: "BUY" };
      if (g.settings.auctions && g.canBuy % 2 === 0) return { type: "AUCTION" }; // bots sometimes put it up for auction
    }
    for (let i = 0; i < B(g).length; i++) {
      if (g.owners[i] === p.id && houseCost(B(g), i) > 0 && p.money - houseCost(B(g), i) >= 250 && !buildError(g, p.id, i)) {
        return { type: "BUILD", square: i };
      }
    }
    return { type: "END_TURN" };
  }
  return null;
}
