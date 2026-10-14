import assert from "node:assert/strict";
import { apply, botAction, currentPlayer, newGame, BOARD } from "../shared/game";

function seeded(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

// Rule checks
{
  const g = newGame("t");
  assert.equal(apply(g, "a", { type: "JOIN", name: "A" }), null);
  assert.equal(apply(g, "a", { type: "START" }), "Need at least 2 players (add a bot!).");
  assert.equal(apply(g, "b", { type: "ROLL" }), "You are not in this game.");
  apply(g, "a", { type: "ADD_BOT" });
  assert.equal(apply(g, "a", { type: "START" }), null);
  assert.equal(apply(g, g.players[1].id, { type: "ROLL" }), "Not your turn.");
  assert.equal(apply(g, "a", { type: "BUY" }), "Nothing to buy.");
  assert.equal(apply(g, "a", { type: "JOIN", name: "late" }), null); // reconnect ok
  assert.equal(apply(g, "zz", { type: "JOIN", name: "late" }), "Game already started.");
}

// Full games with bots always terminate with exactly one winner and sane state
for (let seed = 1; seed <= 200; seed++) {
  const rng = seeded(seed);
  const g = newGame("sim");
  apply(g, "h", { type: "JOIN", name: "Host" }, rng);
  g.players[0].isBot = true;
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
    for (const o of Object.values(g.owners)) assert.ok(!g.players.find((p) => p.id === o)!.bankrupt, "bankrupt owns land");
    assert.ok(++steps < 20000, `game ${seed} did not finish`);
  }
  assert.equal(g.players.filter((p) => !p.bankrupt).length, 1);
  assert.equal(g.winnerId, g.players.find((p) => !p.bankrupt)!.id);
}
console.log("selftest OK");
