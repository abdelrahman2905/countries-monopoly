import assert from "node:assert/strict";
import {
  apply, botAction, buildError, currentPlayer, groupSquares, houseCost, newGame, rentFor, BOARD,
  DEFAULT_SETTINGS, MAX_BUILD_LEVEL,
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

// Full games with bots always terminate (inflation on) with exactly one winner and sane state
for (let seed = 1; seed <= 150; seed++) {
  const rng = seeded(seed);
  const g = newGame("sim");
  apply(g, "h", { type: "JOIN", name: "Host" }, rng);
  g.players[0].isBot = true;
  g.settings = { ...DEFAULT_SETTINGS, buildings: seed % 4 !== 0, doublesRoll: seed % 3 !== 0, freeParkingPot: seed % 2 === 0 };
  for (let i = 0; i < 1 + (seed % 5); i++) apply(g, "h", { type: "ADD_BOT" }, rng);
  assert.equal(apply(g, "h", { type: "START" }, rng), null);
  let steps = 0;
  while (g.phase !== "over") {
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
