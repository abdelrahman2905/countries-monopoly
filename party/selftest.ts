import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  apply, botAction, buildError, currentPlayer, groupSquares, houseCost, newGame, rentFor, BOARD,
  DEFAULT_SETTINGS, MAX_BUILD_LEVEL, BIG_BOARD, jailIndex, TEAMS, boardOf, ownsGroup, PLAYER_COLORS, repairBill, salaryFor, finishAuction, botAuctionBid, resolveBotTrades, claimableSquares, FREE_COUNTRY_CARD, CHANCE_DECK_SIZE,
} from "../shared/game";

function seeded(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

// Board sanity: classic 40 squares / 32 countries, team-mode 80 squares / 64 countries
assert.equal(BOARD.length, 40);
assert.equal(BOARD.filter((s) => s.kind === "country").length, 32);
for (let gr = 0; gr < 12; gr++) assert.ok([2, 3].includes(groupSquares(BOARD, gr).length), `group ${gr}`);
assert.equal(BIG_BOARD.length, 80);
assert.equal(BIG_BOARD.filter((s) => s.kind === "country").length, 64);
assert.equal(BIG_BOARD.filter((s) => s.kind === "chance").length, 12);
assert.equal(new Set(BIG_BOARD.flatMap((s) => (s.kind === "country" ? [s.iso] : []))).size, 64, "unique countries");
for (let gr = 0; gr < 24; gr++) assert.ok([2, 3].includes(groupSquares(BIG_BOARD, gr).length), `big group ${gr}`);
assert.deepEqual([0, 20, 40, 60].map((i) => BIG_BOARD[i].kind), ["go", "jail", "parking", "gotojail"]);
assert.equal(jailIndex(BOARD), 10);
assert.equal(jailIndex(BIG_BOARD), 20);
const flagFiles = new Set(readdirSync("public/flags"));
const shapes = JSON.parse(readFileSync("src/data/shapes.json", "utf8"));
for (const s of BIG_BOARD) if (s.kind === "country") {
  assert.ok(flagFiles.has(`${s.iso}.svg`), `flag ${s.iso}`);
  assert.ok(shapes[s.iso], `shape ${s.iso}`);
}
const prices = BIG_BOARD.flatMap((s) => (s.kind === "country" ? [s.price] : []));
assert.deepEqual(prices, [...prices].sort((a, b) => a - b), "prices rise around the board");

// Rule checks
{
  const g = newGame("t");
  assert.equal(apply(g, "a", { type: "JOIN", name: "A" }), null);
  assert.equal(apply(g, "a", { type: "START" }), "Need at least 2 players (add a bot!)." );
  assert.equal(apply(g, "b", { type: "ROLL" }), "You are not in this game.");
  apply(g, "a", { type: "ADD_BOT" });
  assert.equal(apply(g, "a", { type: "SET_SETTINGS", settings: { startMoney: 2000, buildings: false } }), null);
  assert.equal(apply(g, "a", { type: "SET_SETTINGS", settings: { startMoney: 7 } }), "Invalid value.");
  assert.equal(apply(g, "a", { type: "SET_SETTINGS", settings: { hack: true } as never }), "Unknown setting.");
  assert.equal(apply(g, "a", { type: "SET_SETTINGS", settings: { maxPlayers: 6, buildings: true } }), null);
  assert.equal(apply(g, "a", { type: "START" }), null);
  assert.equal(g.players[0].money, 2000);
  assert.equal(apply(g, "a", { type: "SET_SETTINGS", settings: { startMoney: 1000 } }), "Settings are locked once the game starts.");
  assert.equal(apply(g, g.players[1].id, { type: "ROLL" }), "Not your turn.");
  assert.equal(apply(g, "a", { type: "BUY" }), "Nothing to buy.");
  assert.equal(apply(g, "zz", { type: "JOIN", name: "late" }), "Game already started.");
}

// Profiles: unique colors, name editing only in the lobby
{
  const g = newGame("p");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "b", { type: "JOIN", name: "B" });
  assert.notEqual(g.players[0].color, g.players[1].color);
  assert.equal(apply(g, "b", { type: "SET_PROFILE", color: g.players[0].color }), "That color is taken.");
  assert.equal(apply(g, "b", { type: "SET_PROFILE", color: "#123456" }), "Unknown color.");
  assert.equal(apply(g, "b", { type: "SET_PROFILE", name: "  Zed ", color: PLAYER_COLORS[11] }), null);
  assert.equal(g.players[1].name, "Zed");
  assert.equal(g.players[1].color, PLAYER_COLORS[11]);
  assert.equal(apply(g, "b", { type: "SET_PROFILE", name: "   " }), "Name can't be empty.");
}

// Go salary: $300 per pass, bonus salary after N rounds; repair bill: $15/country, $40/house, $50/hotel
{
  const g = newGame("s");
  assert.equal(salaryFor(g), 300);
  g.round = 5;
  assert.equal(salaryFor(g), 1000);
  g.settings.bonusAfterRounds = 0;
  assert.equal(salaryFor(g), 300);
  const [x, y] = groupSquares(BOARD, 0);
  assert.equal(repairBill(g, "a"), 0);
  g.owners[x] = "a"; g.owners[y] = "a";
  assert.equal(repairBill(g, "a"), 30);
  g.houses[x] = 2; g.houses[y] = MAX_BUILD_LEVEL;
  assert.equal(repairBill(g, "a"), 15 + 80 + 15 + 50);
}

// Building: needs the full set, builds evenly, charges money, raises rent, sells for half
{
  const g = newGame("b");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "a", { type: "ADD_BOT" });
  apply(g, "a", { type: "START" });
  g.settings.inflation = false;
  const [x, y] = groupSquares(BOARD, 0);
  g.owners[x] = "a";
  assert.match(buildError(g, "a", x)!, /every country/);
  g.owners[y] = "a";
  g.phase = "action"; g.turn = 0;
  const base = rentFor(g, x);
  assert.equal(apply(g, "a", { type: "BUILD", square: x }), null);
  assert.match(apply(g, "a", { type: "BUILD", square: x })!, /evenly/);
  assert.equal(g.players[0].money, 1500 - houseCost(BOARD, x));
  assert.ok(rentFor(g, x) > base);
  assert.match(apply(g, "a", { type: "SELL", square: y })!, /Nothing|evenly/);
  assert.equal(apply(g, "a", { type: "SELL", square: x }), null);
  for (let i = 0; i < MAX_BUILD_LEVEL; i++) {
    apply(g, "a", { type: "BUILD", square: x });
    apply(g, "a", { type: "BUILD", square: y });
  }
  assert.equal(g.houses[x], MAX_BUILD_LEVEL);
  assert.match(apply(g, "a", { type: "BUILD", square: x })!, /hotel/);
  g.turn = 1; // not a's turn
  assert.match(apply(g, "a", { type: "SELL", square: x })!, /own turn/);
}

// Auction: anyone can bid +2/+5/+50, no self-outbidding, highest bidder pays and gets the country
{
  const g = newGame("au");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "b", { type: "JOIN", name: "B" });
  apply(g, "a", { type: "START" });
  const sq = groupSquares(BOARD, 3)[0]; // Pakistan, price 180
  g.phase = "action"; g.turn = 0; g.canBuy = sq;
  g.settings.auctions = false;
  assert.match(apply(g, "a", { type: "AUCTION" })!, /turned off/);
  g.settings.auctions = true;
  assert.equal(apply(g, "b", { type: "AUCTION" }), "Not your turn.");
  assert.equal(apply(g, "a", { type: "AUCTION" }), null);
  assert.equal(g.phase, "auction");
  assert.equal(g.auction!.bid, 18);
  assert.match(apply(g, "a", { type: "BUY" })!, /Nothing to buy/);
  assert.equal(apply(g, "b", { type: "BID", inc: 3 }), "Invalid bid.");
  assert.equal(apply(g, "b", { type: "BID", inc: 2 }), null);
  assert.equal(g.auction!.bid, 20);
  assert.match(apply(g, "b", { type: "BID", inc: 5 })!, /already/);
  assert.equal(apply(g, "a", { type: "BID", inc: 50 }), null);
  assert.equal(g.auction!.bid, 70);
  g.players[1].money = 60;
  assert.match(apply(g, "b", { type: "BID", inc: 50 })!, /You need \$120/);
  finishAuction(g);
  assert.equal(g.owners[sq], "a");
  assert.equal(g.players[0].money, 1500 - 70);
  assert.equal(g.phase, "action");
  assert.equal(g.auction, null);
}

// Bank loans: borrow, repay, overdue -> bank collects cash, else forced sale of a country
{
  const g = newGame("ln");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "b", { type: "JOIN", name: "B" });
  apply(g, "a", { type: "START" });
  assert.match(apply(g, "a", { type: "TAKE_LOAN", amount: 500 })!, /turned off/);
  g.settings.loans = true;
  assert.equal(apply(g, "a", { type: "TAKE_LOAN", amount: 123 }), "Invalid loan amount.");
  assert.equal(apply(g, "b", { type: "TAKE_LOAN", amount: 500 }), "You can borrow on your own turn.");
  assert.equal(apply(g, "a", { type: "TAKE_LOAN", amount: 500 }), null);
  assert.equal(g.players[0].money, 2000);
  assert.deepEqual(g.loans["a"], { debt: 550, due: 5 });
  assert.match(apply(g, "a", { type: "TAKE_LOAN", amount: 200 })!, /Repay/);
  assert.equal(apply(g, "a", { type: "REPAY" }), null);
  assert.equal(g.players[0].money, 1450);
  assert.equal(g.loans["a"], undefined);

  // overdue with enough cash: collected automatically
  apply(g, "a", { type: "TAKE_LOAN", amount: 200 });
  g.round = 20; g.phase = "action"; g.turn = 1;
  apply(g, "b", { type: "END_TURN" });
  assert.equal(g.phase, "roll");
  assert.equal(g.turn, 0);
  assert.equal(g.loans["a"], undefined);
  assert.equal(g.players[0].money, 1650 - 220);

  // overdue without cash: must choose a country to sell
  const [x, y] = [groupSquares(BOARD, 11)[2], groupSquares(BOARD, 0)[0]]; // Russia 480, Nigeria 60
  g.owners[x] = "a"; g.owners[y] = "a";
  g.phase = "roll"; g.turn = 0;
  apply(g, "a", { type: "TAKE_LOAN", amount: 500 });
  g.players[0].money = 0;
  g.round = 40; g.phase = "action"; g.turn = 1;
  apply(g, "b", { type: "END_TURN" });
  assert.equal(g.phase, "sell");
  assert.equal(g.turn, 0);
  assert.equal(apply(g, "a", { type: "ROLL" }), "You can't roll now.");
  assert.equal(apply(g, "a", { type: "REPAY" }), "You need $550 to repay.");
  assert.equal(apply(g, "a", { type: "SELL_COUNTRY", square: 3 }), "You don't own that country.");
  assert.equal(apply(g, "a", { type: "SELL_COUNTRY", square: y }), null); // 550 - 60 = 490 left
  assert.equal(g.phase, "sell");
  assert.equal(apply(g, "a", { type: "SELL_COUNTRY", square: x }), null); // 480 < 490 -> still owes 10, no cash
  assert.equal(g.players[0].bankrupt, true); // nothing left to sell and no cash: bankrupt
}

// Jail: a released player skips exactly one turn in a 2-player game
{
  const g = newGame("jl");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "b", { type: "JOIN", name: "B" });
  apply(g, "a", { type: "START" });
  g.players[1].jailed = true;
  g.phase = "action"; g.turn = 0;
  apply(g, "a", { type: "END_TURN" });
  assert.equal(g.turn, 0); // b skipped, back to a
  assert.equal(g.players[1].jailed, false);
  assert.equal(g.phase, "roll");
}

// Trading: countries for countries and/or money, either side may add no money at all
{
  const g = newGame("tr");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "b", { type: "JOIN", name: "B" });
  apply(g, "a", { type: "START" });
  const [e, f] = groupSquares(BOARD, 1); // Egypt, Morocco
  const [n] = groupSquares(BOARD, 0); // Nigeria
  g.owners[e] = "a"; g.owners[f] = "b"; g.owners[n] = "b";
  const A = g.players[0], Bp = g.players[1];
  const offer = { type: "PROPOSE_TRADE" as const, to: "b", give: [e], take: [f, n], giveMoney: 0, takeMoney: 0 };
  assert.equal(apply(g, "a", { ...offer, to: "a" }), "Pick another player.");
  assert.match(apply(g, "a", { ...offer, give: [f] })!, /your own countries/);
  assert.match(apply(g, "a", { ...offer, take: [e] })!, /no longer own/);
  assert.equal(apply(g, "a", { ...offer, giveMoney: 9999 }), "You don't have that much money.");
  assert.equal(apply(g, "a", { ...offer, giveMoney: -5 }), "Invalid amount of money.");
  assert.equal(apply(g, "a", { type: "PROPOSE_TRADE", to: "b", give: [], take: [], giveMoney: 0, takeMoney: 0 }), "The deal is empty.");
  assert.equal(apply(g, "a", { ...offer, giveMoney: 100 }), null);
  assert.equal(g.trades.length, 1);
  assert.equal(apply(g, "a", { type: "ACCEPT_TRADE", id: 1 }), "That deal is no longer available."); // only the receiver can accept
  assert.equal(apply(g, "a", { ...offer, giveMoney: 50 }), null); // a new offer replaces the old one
  assert.equal(g.trades.length, 1);
  const id = g.trades[0].id;
  Bp.money = 5;
  assert.equal(apply(g, "b", { type: "ACCEPT_TRADE", id }), null);
  assert.equal(g.owners[e], "b");
  assert.equal(g.owners[f], "a");
  assert.equal(g.owners[n], "a");
  assert.equal(A.money, 1500 - 50);
  assert.equal(Bp.money, 55);
  assert.equal(g.trades.length, 0);
  // money requested by the proposer, no countries given
  assert.equal(apply(g, "b", { type: "PROPOSE_TRADE", to: "a", give: [e], take: [], giveMoney: 0, takeMoney: 200 }), null);
  assert.equal(apply(g, "a", { type: "CANCEL_TRADE", id: g.trades[0].id }), null); // declined
  assert.equal(g.trades.length, 0);
  // buildings block a trade; offers become void if ownership changes
  g.houses[e] = 1;
  assert.match(apply(g, "b", { type: "PROPOSE_TRADE", to: "a", give: [e], take: [], giveMoney: 0, takeMoney: 10 })!, /without houses/);
  delete g.houses[e];
  apply(g, "b", { type: "PROPOSE_TRADE", to: "a", give: [e], take: [], giveMoney: 0, takeMoney: 10 });
  g.owners[e] = "a";
  g.phase = "action"; g.turn = 0;
  apply(g, "a", { type: "GIVE", to: "b", amount: 50 }); // any successful action prunes stale offers
  assert.equal(g.trades.length, 0);
  // no trading during an auction
  g.phase = "auction";
  assert.match(apply(g, "b", { type: "PROPOSE_TRADE", to: "a", give: [], take: [], giveMoney: 5, takeMoney: 0 })!, /auction/);
  // bots accept good offers and refuse bad ones
  const g2 = newGame("trb");
  apply(g2, "a", { type: "JOIN", name: "A" });
  apply(g2, "a", { type: "ADD_BOT" });
  apply(g2, "a", { type: "START" });
  const bot = g2.players[1];
  g2.owners[n] = "a"; // Nigeria $60
  apply(g2, "a", { type: "PROPOSE_TRADE", to: bot.id, give: [n], take: [], giveMoney: 0, takeMoney: 10 });
  resolveBotTrades(g2);
  assert.equal(g2.owners[n], bot.id, "bot accepted a good deal");
  g2.owners[e] = bot.id;
  apply(g2, "a", { type: "PROPOSE_TRADE", to: bot.id, give: [], take: [e], giveMoney: 10, takeMoney: 0 });
  resolveBotTrades(g2);
  assert.equal(g2.owners[e], bot.id, "bot refused a bad deal");
  assert.equal(g2.trades.length, 0);
}

// Free-country Chance card: once per game, pick any free country in a color set where you own nothing
{
  const g = newGame("fc");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "b", { type: "JOIN", name: "B" });
  apply(g, "a", { type: "START" });
  const me = g.players[0];
  const [e, f] = groupSquares(BOARD, 1);
  g.owners[e] = "a"; // a already owns a country in group 1
  g.owners[groupSquares(BOARD, 2)[0]] = "b";
  const claimable = claimableSquares(g, "a");
  assert.ok(!claimable.includes(f), "same color set is excluded");
  assert.ok(claimable.includes(groupSquares(BOARD, 2)[1]), "free country elsewhere is allowed");
  assert.ok(!claimable.includes(groupSquares(BOARD, 2)[0]), "owned country is excluded");
  const drawFree = () => {
    g.phase = "roll"; g.turn = 0; me.pos = 5; // chance square 13 = 5 + 4 + 4
    const seq = [0.5, 0.5, (FREE_COUNTRY_CARD + 0.5) / CHANCE_DECK_SIZE];
    let k = 0;
    apply(g, "a", { type: "ROLL" }, () => seq[Math.min(k++, 2)]);
  };
  drawFree();
  assert.equal(g.phase, "claim");
  assert.equal(g.freeCountryUsed, true);
  assert.equal(apply(g, "b", { type: "CLAIM", square: groupSquares(BOARD, 2)[1] }), "You can't claim a country now.");
  assert.match(apply(g, "a", { type: "CLAIM", square: f })!, /color set where you own nothing/);
  assert.match(apply(g, "a", { type: "CLAIM", square: groupSquares(BOARD, 2)[0] })!, /free country/);
  assert.equal(apply(g, "a", { type: "ROLL" }), "You can't roll now.");
  const money = me.money;
  const pick = groupSquares(BOARD, 2)[1];
  assert.equal(apply(g, "a", { type: "CLAIM", square: pick }), null);
  assert.equal(g.owners[pick], "a");
  assert.equal(me.money, money, "free");
  assert.equal(g.phase, "action");
  // the card never comes back
  drawFree();
  assert.notEqual(g.phase, "claim");
}

// Vacation: a share of every rent goes into the jackpot; whoever lands on Vacation takes it
{
  const g = newGame("vc");
  apply(g, "a", { type: "JOIN", name: "A" });
  apply(g, "b", { type: "JOIN", name: "B" });
  apply(g, "a", { type: "START" });
  g.settings.inflation = false;
  g.settings.doublesRoll = false;
  assert.equal(BOARD[20].name, "Vacation");
  const russia = groupSquares(BOARD, 11)[2]; // price 480, rent 48
  g.owners[russia] = "b";
  const [A, Bp] = g.players;
  const roll = (pos: number) => { g.phase = "roll"; g.turn = 0; A.pos = pos; apply(g, "a", { type: "ROLL" }, () => 0.5); }; // 4 + 4 = 8
  roll(russia - 8);
  assert.equal(A.money, 1500 - 48);
  assert.equal(Bp.money, 1500 + 36, "owner keeps 75%");
  assert.equal(g.pot, 12, "25% went to the Vacation jackpot");
  roll(20 - 8);
  assert.equal(A.pos, 20);
  assert.equal(A.money, 1500 - 48 + 12, "landing on Vacation takes the jackpot");
  assert.equal(g.pot, 0);
  // share 0 or jackpot off: owners get the full rent
  g.settings.vacationShare = 0;
  roll(russia - 8);
  assert.equal(g.pot, 0);
  g.settings.vacationShare = 100;
  g.settings.vacationPot = false;
  roll(russia - 8);
  assert.equal(g.pot, 0, "jackpot off: nothing collected");
  g.settings.vacationPot = true;
  const before = Bp.money;
  roll(russia - 8);
  assert.equal(Bp.money, before, "100% share: the owner gets nothing, the jackpot gets it all");
  assert.equal(g.pot, 48);
}

// Teams: big map, rent-free land for teammates, shared color sets, gifts, last team standing wins
{
  const g = newGame("tm");
  for (const id of ["a", "b", "c", "d"]) apply(g, id, { type: "JOIN", name: id.toUpperCase() });
  assert.equal(apply(g, "a", { type: "SET_PROFILE", team: 1 }), "Teams are not enabled in this room.");
  assert.equal(apply(g, "a", { type: "SET_SETTINGS", settings: { teamMode: true, teamCount: 2 } }), null);
  assert.deepEqual(g.players.map((p) => p.team), [0, 1, 0, 1]);
  assert.equal(apply(g, "c", { type: "SET_PROFILE", team: 2 }), "Unknown team.");
  apply(g, "a", { type: "SET_SETTINGS", settings: { teamCount: 4 } });
  assert.equal(apply(g, "c", { type: "SET_PROFILE", team: 3 }), null);
  apply(g, "c", { type: "SET_PROFILE", team: 0 });
  apply(g, "a", { type: "SET_SETTINGS", settings: { teamCount: 2 } });
  assert.deepEqual(g.players.map((p) => p.team), [0, 1, 0, 1]);
  for (const p of g.players) p.team = 0;
  assert.equal(apply(g, "a", { type: "START" }), "Team mode needs players on at least 2 teams.");
  g.players[1].team = 1; g.players[3].team = 1;
  g.players.reverse(); // scramble: d b c a
  assert.equal(apply(g, g.hostId!, { type: "START" }), null);
  assert.deepEqual(g.players.map((p) => p.team), [0, 1, 0, 1], "turns alternate between teams");
  assert.equal(boardOf(g).length, 80);

  assert.equal(apply(g, "a", { type: "GIVE", to: "c", amount: 100 }), null);
  assert.equal(g.players.find((p) => p.id === "c")!.money, 1600);
  assert.equal(apply(g, "a", { type: "GIVE", to: "b", amount: 100 }), "You can only give money to a teammate.");
  assert.equal(apply(g, "a", { type: "GIVE", to: "c", amount: 7 }), "Invalid amount.");

  // landing on a teammate's country is free; on an opponent's it costs rent
  const idx = BIG_BOARD.findIndex((s, i) => s.kind === "country" && i >= 10);
  const mover = g.players[0]; // current turn
  const teammate = g.players.find((p) => p.team === mover.team && p.id !== mover.id)!;
  const opponent = g.players.find((p) => p.team !== mover.team)!;
  g.settings.inflation = false;
  const roll = () => { g.phase = "roll"; g.turn = 0; mover.pos = idx - 8; apply(g, mover.id, { type: "ROLL" }, () => 0.5); };
  g.owners[idx] = teammate.id;
  const m0 = mover.money;
  roll();
  assert.equal(mover.pos, idx);
  assert.equal(mover.money, m0 + 0, "no rent for a teammate's country");
  g.owners[idx] = opponent.id;
  g.settings.doublesRoll = false;
  mover.money = 1000;
  roll();
  assert.ok(mover.money < 1000, "rent paid to an opponent");

  // a color set shared between teammates counts as complete
  const [s1, s2] = groupSquares(BIG_BOARD, 0);
  g.owners = { [s1]: mover.id, [s2]: teammate.id };
  assert.equal(ownsGroup(g, mover.id, 0), true);
  assert.equal(ownsGroup(g, opponent.id, 0), false);
  mover.money = 1500; g.phase = "action"; g.turn = 0;
  assert.equal(buildError(g, mover.id, s1), null);

  // last team standing wins together
  for (const p of g.players) if (p.team !== mover.team) p.bankrupt = true;
  assert.equal(apply(g, mover.id, { type: "GIVE", to: teammate.id, amount: 50 }), null);
  assert.equal(g.phase, "over");
  assert.equal(g.winnerTeam, mover.team);
  assert.match(g.log.at(-1)!, new RegExp(`Team ${TEAMS[mover.team].name} wins`));
}

// Full games with bots always terminate (inflation on) with exactly one winner and sane state
for (let seed = 1; seed <= 150; seed++) {
  const rng = seeded(seed);
  const g = newGame("sim");
  apply(g, "h", { type: "JOIN", name: "Host" }, rng);
  g.players[0].isBot = true;
  g.settings = {
    ...DEFAULT_SETTINGS, buildings: seed % 4 !== 0, doublesRoll: seed % 3 !== 0, vacationPot: seed % 2 === 0, vacationShare: [0, 10, 25, 50, 100][seed % 5],
    loans: seed % 5 !== 0, auctions: seed % 7 !== 0,
    teamMode: seed % 3 === 0, teamCount: 2 + (seed % 3),
  };
  for (let i = 0; i < 1 + (seed % 5); i++) apply(g, "h", { type: "ADD_BOT" }, rng);
  assert.equal(apply(g, "h", { type: "START" }, rng), null);
  let steps = 0;
  while (g.phase !== "over") {
    if (g.phase === "auction") {
      // the server runs the auction timer; here bots bid until nobody wants to, then it ends
      const bid = botAuctionBid(g, rng);
      if (bid) assert.equal(apply(g, bid.playerId, { type: "BID", inc: bid.inc }), null);
      else finishAuction(g);
      assert.ok(++steps < 30000);
      continue;
    }
    const a = botAction(g);
    assert.ok(a, `no action in phase ${g.phase} (seed ${seed})`);
    assert.equal(apply(g, currentPlayer(g).id, a, rng), null);
    for (const p of g.players) {
      assert.ok(p.money >= 0, "negative money");
      assert.ok(p.pos >= 0 && p.pos < boardOf(g).length);
    }
    for (const [i, o] of Object.entries(g.owners)) assert.ok(!g.players.find((p) => p.id === o)!.bankrupt, "bankrupt owns land");
    for (const i of Object.keys(g.houses)) assert.ok(g.owners[Number(i)], "building on unowned land");
    assert.ok(++steps < 30000, `game ${seed} did not finish`);
  }
  const left = g.players.filter((p) => !p.bankrupt);
  if (g.settings.teamMode) {
    assert.ok(left.length >= 1 && left.every((p) => p.team === left[0].team), "one team left");
    assert.equal(g.winnerTeam, left[0].team);
  } else {
    assert.equal(left.length, 1);
    assert.equal(g.winnerId, left[0].id);
  }
}
console.log("selftest OK");
