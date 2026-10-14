import assert from "node:assert/strict";
import {
  apply, botAction, buildError, currentPlayer, groupSquares, houseCost, newGame, rentFor, BOARD,
  DEFAULT_SETTINGS, MAX_BUILD_LEVEL, PLAYER_COLORS, repairBill, salaryFor, finishAuction, botAuctionBid,
} from "../shared/game";

function seeded(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

// Board sanity
assert.equal(BOARD.length, 40);
assert.equal(BOARD.filter((s) => s.kind === "country").length, 32);
for (let gr = 0; gr < 12; gr++) assert.ok([2, 3].includes(groupSquares(gr).length), `group ${gr}`);

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
  const [x, y] = groupSquares(0);
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
  const [x, y] = groupSquares(0);
  g.owners[x] = "a";
  assert.match(buildError(g, "a", x)!, /every country/);
  g.owners[y] = "a";
  g.phase = "action"; g.turn = 0;
  const base = rentFor(g, x);
  assert.equal(apply(g, "a", { type: "BUILD", square: x }), null);
  assert.match(apply(g, "a", { type: "BUILD", square: x })!, /evenly/);
  assert.equal(g.players[0].money, 1500 - houseCost(x));
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
  const sq = groupSquares(3)[0]; // Pakistan, price 180
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
  const [x, y] = [groupSquares(11)[2], groupSquares(0)[0]]; // Russia 480, Nigeria 60
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

// Full games with bots always terminate (inflation on) with exactly one winner and sane state
for (let seed = 1; seed <= 150; seed++) {
  const rng = seeded(seed);
  const g = newGame("sim");
  apply(g, "h", { type: "JOIN", name: "Host" }, rng);
  g.players[0].isBot = true;
  g.settings = {
    ...DEFAULT_SETTINGS, buildings: seed % 4 !== 0, doublesRoll: seed % 3 !== 0, freeParkingPot: seed % 2 === 0,
    loans: seed % 5 !== 0, auctions: seed % 7 !== 0,
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
      assert.ok(p.pos >= 0 && p.pos < BOARD.length);
    }
    for (const [i, o] of Object.entries(g.owners)) assert.ok(!g.players.find((p) => p.id === o)!.bankrupt, "bankrupt owns land");
    for (const i of Object.keys(g.houses)) assert.ok(g.owners[Number(i)], "building on unowned land");
    assert.ok(++steps < 30000, `game ${seed} did not finish`);
  }
  assert.equal(g.players.filter((p) => !p.bankrupt).length, 1);
  assert.equal(g.winnerId, g.players.find((p) => !p.bankrupt)!.id);
}
console.log("selftest OK");
