import { useEffect, useState } from "react";
import {
  BID_INCREMENTS, TEAMS, boardOf, claimableSquares, bankBuyPrice, currentPlayer, rentMultiplier, salaryFor, type GameState, type Player,
} from "../../shared/game";
import type { useGame } from "../lib/useGame";
import { Flag } from "./CountryArt";

type Send = ReturnType<typeof useGame>["send"];
type Props = { g: GameState; me: Player; busy: boolean; send: Send; onLeave: () => void };

const btn =
  "rounded-lg px-3 py-2 font-semibold text-white shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed sm:px-4";

export function Countdown({ deadline, label = "left" }: { deadline: number; label?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));
  return <div className={`text-xs ${left <= 5 ? "text-red-300" : "text-slate-300"}`}>⏱ {left}s {label}</div>;
}

/** The content in the middle of the board: whose turn it is and what you can do right now. */
export default function TurnPanel({ g, me, busy, send, onLeave }: Props) {
  const cur = currentPlayer(g);
  const myTurn = cur.id === me.id && !me.bankrupt;
  const winner = g.players.find((p) => p.id === g.winnerId);

  if (g.phase === "over") {
    return (
      <>
        <div className="text-4xl">🏆</div>
        {g.winnerTeam !== null ? (
          <>
            <div className="text-xl font-extrabold" style={{ color: TEAMS[g.winnerTeam].color }}>
              {TEAMS[g.winnerTeam].icon} Team {TEAMS[g.winnerTeam].name} wins!
            </div>
            <div className="text-sm text-slate-300">{g.players.filter((p) => p.team === g.winnerTeam).map((p) => p.name).join(" · ")}</div>
          </>
        ) : (
          <div className="text-xl font-extrabold">{winner?.name} wins!</div>
        )}
        <button onClick={onLeave} className={`${btn} bg-indigo-600`}>Back to lobby</button>
      </>
    );
  }

  if (g.phase === "auction" && g.auction) return <AuctionPanel g={g} me={me} send={send} />;

  const buy = g.canBuy !== null ? boardOf(g)[g.canBuy] : null;
  const mult = rentMultiplier(g);
  const loan = g.loans[me.id];

  return (
    <>
      <div className="flex items-center gap-2 text-sm font-semibold sm:text-lg">
        <span className="h-3 w-3 rounded-full ring-2 ring-white/70" style={{ background: cur.color }} />
        {myTurn ? "Your turn!" : `${cur.name}'s turn`}
        {g.settings.teamMode && <span title={`Team ${TEAMS[cur.team]?.name}`}>{TEAMS[cur.team]?.icon}</span>}
        {cur.isBot && " 🤖"}
        {!cur.connected && " (offline)"}
      </div>

      {g.phase === "claim" ? (
        myTurn ? <ClaimPanel g={g} me={me} send={send} /> : <div className="text-sm text-amber-300">🎁 {cur.name} is choosing a free country…</div>
      ) : g.phase === "sell" ? (
        myTurn && loan ? (
          <SellPanel g={g} me={me} send={send} />
        ) : (
          <div className="text-sm text-amber-300">🏦 {cur.name} owes the bank and must sell a country.</div>
        )
      ) : (
        <>
          {myTurn && g.phase === "roll" && (
            <button disabled={busy} onClick={() => send({ type: "ROLL" })} className={`${btn} bg-indigo-500 text-base hover:bg-indigo-400 sm:text-lg`}>
              🎲 Roll dice
            </button>
          )}
          {myTurn && g.phase === "action" && (
            <div className="flex flex-wrap justify-center gap-2">
              {buy && buy.kind === "country" && (
                <>
                  <button
                    disabled={busy}
                    onClick={() => send({ type: "BUY" })}
                    className={`${btn} flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500`}
                  >
                    <Flag iso={buy.iso} name={buy.name} className="w-6" /> Buy ${buy.price}
                  </button>
                  {g.settings.auctions && (
                    <button disabled={busy} onClick={() => send({ type: "AUCTION" })} className={`${btn} bg-amber-600 hover:bg-amber-500`}>
                      🔨 Auction
                    </button>
                  )}
                </>
              )}
              <button disabled={busy} onClick={() => send({ type: "END_TURN" })} className={`${btn} bg-slate-600 hover:bg-slate-500`}>
                {buy ? (g.extraRoll ? "Skip & roll again" : "Skip") : g.extraRoll ? "Roll again" : "End turn"}
              </button>
            </div>
          )}
        </>
      )}

      {!myTurn && me.bankrupt && <div className="text-sm text-red-300">You are bankrupt, spectating.</div>}
      {g.turnDeadline && <Countdown deadline={g.turnDeadline} />}
      <div className="text-xs text-emerald-300">🏁 Passing Go pays ${salaryFor(g)}</div>
      {g.settings.freeParkingPot && g.pot > 0 && <div className="text-xs text-amber-300">🅿️ Jackpot ${g.pot}</div>}
      {mult > 1 && <div className="text-xs text-rose-300">Rent inflation ×{mult.toFixed(2)}</div>}
      <div className="text-xs text-slate-400">Tap any country for details{g.settings.buildings ? " and to build" : ""}.</div>
    </>
  );
}

function AuctionPanel({ g, me, send }: { g: GameState; me: Player; send: Send }) {
  const au = g.auction!;
  const s = boardOf(g)[au.square];
  if (s.kind !== "country") return null;
  const leader = g.players.find((p) => p.id === au.bidderId);
  const iLead = au.bidderId === me.id;
  return (
    <div className="pop flex flex-col items-center gap-2">
      <div className="text-sm font-bold text-amber-300">🔨 AUCTION</div>
      <div className="flex items-center gap-3">
        <Flag iso={s.iso} name={s.name} className="w-14" />
        <div className="text-left">
          <div className="text-lg font-extrabold leading-tight">{s.name}</div>
          <div className="text-xs text-slate-400">Price ${s.price}</div>
        </div>
      </div>
      <div className="text-3xl font-extrabold text-emerald-300">${au.bid}</div>
      <div className="text-sm">
        {leader ? (
          <>Highest bid: <b style={{ color: leader.color }}>{leader.name}{iLead && " (you)"}</b></>
        ) : (
          <span className="text-slate-400">Starting bid. No bids yet</span>
        )}
      </div>
      {au.deadline && <Countdown deadline={au.deadline} label="until it's sold" />}
      <div className="flex gap-2">
        {BID_INCREMENTS.map((inc) => (
          <button
            key={inc}
            disabled={me.bankrupt || iLead || me.money < au.bid + inc}
            onClick={() => send({ type: "BID", inc })}
            className={`${btn} bg-amber-600 hover:bg-amber-500`}
          >
            +${inc}
          </button>
        ))}
      </div>
      <div className="text-xs text-slate-400">
        {iLead ? "You have the highest bid. Wait for others…" : me.money < au.bid + BID_INCREMENTS[0] ? "You can't afford to raise." : "Everyone can bid at any time."}
      </div>
    </div>
  );
}

function SellPanel({ g, me, send }: { g: GameState; me: Player; send: Send }) {
  const loan = g.loans[me.id]!;
  const owned = boardOf(g).flatMap((s, i) => (g.owners[i] === me.id && s.kind === "country" ? [{ s, i }] : []));
  return (
    <div className="pop flex max-w-full flex-col items-center gap-2">
      <div className="text-sm font-bold text-amber-300">🏦 Your loan is overdue!</div>
      <div className="text-sm">
        You owe the bank <b className="text-red-300">${loan.debt}</b>. Pay it, or choose a country to sell to the bank.
      </div>
      <button disabled={me.money < loan.debt} onClick={() => send({ type: "REPAY" })} className={`${btn} bg-emerald-600 hover:bg-emerald-500`}>
        Repay ${loan.debt}
      </button>
      <div className="flex max-h-32 flex-wrap justify-center gap-1 overflow-y-auto">
        {owned.map(({ s, i }) =>
          s.kind === "country" ? (
            <button
              key={i}
              onClick={() => send({ type: "SELL_COUNTRY", square: i })}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                bankBuyPrice(g, i) >= loan.debt ? "bg-emerald-700 hover:bg-emerald-600" : "bg-slate-700 hover:bg-slate-600"
              }`}
              title={bankBuyPrice(g, i) >= loan.debt ? "Covers the whole debt" : "Covers part of the debt"}
            >
              <Flag iso={s.iso} name={s.name} className="w-5" /> {s.name} +${bankBuyPrice(g, i)}
            </button>
          ) : null,
        )}
      </div>
    </div>
  );
}

function ClaimPanel({ g, me, send }: { g: GameState; me: Player; send: Send }) {
  const board = boardOf(g);
  const options = claimableSquares(g, me.id).sort((a, b) => {
    const x = board[a], y = board[b];
    return (y.kind === "country" ? y.price : 0) - (x.kind === "country" ? x.price : 0);
  });
  return (
    <div className="pop flex max-w-full flex-col items-center gap-2">
      <div className="text-sm font-bold text-emerald-300">🎁 Free country!</div>
      <div className="text-sm">Pick any free country, for free. It must be in a color set where you own nothing yet.</div>
      <div className="flex max-h-40 flex-wrap justify-center gap-1 overflow-y-auto">
        {options.map((i) => {
          const s = board[i];
          return s.kind === "country" ? (
            <button
              key={i}
              onClick={() => send({ type: "CLAIM", square: i })}
              className="flex items-center gap-1 rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold hover:bg-emerald-600"
            >
              <Flag iso={s.iso} name={s.name} className="w-5" /> {s.name} <span className="text-emerald-200">${s.price}</span>
            </button>
          ) : null;
        })}
      </div>
    </div>
  );
}
