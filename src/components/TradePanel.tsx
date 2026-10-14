import { useState } from "react";
import { boardOf, level, type GameState, type Player, type Trade } from "../../shared/game";
import type { useGame } from "../lib/useGame";
import { Flag } from "./CountryArt";

type Send = ReturnType<typeof useGame>["send"];

const card = "rounded-2xl bg-slate-900/80 p-4 text-white shadow-lg ring-1 ring-white/10 backdrop-blur";

/** One side of a deal: some countries (with flags) and/or money. */
function Side({ g, squares, money }: { g: GameState; squares: number[]; money: number }) {
  const board = boardOf(g);
  if (!squares.length && !money) return <span className="text-slate-400">nothing</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {squares.map((i) => {
        const s = board[i];
        return s.kind === "country" ? (
          <span key={i} className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
            <Flag iso={s.iso} name={s.name} className="w-4" /> {s.name}
          </span>
        ) : null;
      })}
      {money > 0 && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">${money}</span>}
    </span>
  );
}

function Summary({ g, t }: { g: GameState; t: Trade }) {
  const from = g.players.find((p) => p.id === t.from);
  const to = g.players.find((p) => p.id === t.to);
  return (
    <div className="space-y-1 text-sm">
      <div>
        <b style={{ color: from?.color }}>{from?.name}</b> gives: <Side g={g} squares={t.give} money={t.giveMoney} />
      </div>
      <div>
        <b style={{ color: to?.color }}>{to?.name}</b> gives: <Side g={g} squares={t.take} money={t.takeMoney} />
      </div>
    </div>
  );
}

/** Deals sidebar card: incoming offers, your open offer, and a button to start a new deal. */
export default function TradePanel({ g, me, send }: { g: GameState; me: Player; send: Send }) {
  const [building, setBuilding] = useState(false);
  const incoming = g.trades.filter((t) => t.to === me.id);
  const outgoing = g.trades.filter((t) => t.from === me.id);
  const partners = g.players.filter((p) => p.id !== me.id && !p.bankrupt);
  const open = g.phase === "roll" || g.phase === "action";

  return (
    <>
      <section className={`${card} ${incoming.length ? "ring-2 ring-amber-400" : ""}`}>
        <h3 className="mb-2 font-bold">🤝 Deals {incoming.length > 0 && <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-black">{incoming.length} new</span>}</h3>

        {incoming.map((t) => (
          <div key={t.id} className="mb-3 space-y-2 rounded-lg bg-amber-500/10 p-2">
            <div className="text-xs font-semibold text-amber-300">Offer for you</div>
            <Summary g={g} t={t} />
            <div className="flex gap-2">
              <button
                disabled={!open}
                onClick={() => send({ type: "ACCEPT_TRADE", id: t.id })}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Accept
              </button>
              <button onClick={() => send({ type: "CANCEL_TRADE", id: t.id })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold hover:bg-slate-600">
                Decline
              </button>
            </div>
          </div>
        ))}

        {outgoing.map((t) => (
          <div key={t.id} className="mb-3 space-y-2 rounded-lg bg-white/5 p-2">
            <div className="text-xs font-semibold text-slate-400">Your offer, waiting for {g.players.find((p) => p.id === t.to)?.name}</div>
            <Summary g={g} t={t} />
            <button onClick={() => send({ type: "CANCEL_TRADE", id: t.id })} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold hover:bg-slate-600">
              Withdraw
            </button>
          </div>
        ))}

        <button
          disabled={me.bankrupt || partners.length === 0 || !open}
          onClick={() => setBuilding(true)}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + New deal
        </button>
        {!open && <p className="mt-1 text-xs text-slate-400">Deals are paused during an auction or a special choice.</p>}
      </section>

      {building && <TradeBuilder g={g} me={me} partners={partners} send={send} onClose={() => setBuilding(false)} />}
    </>
  );
}

function TradeBuilder({ g, me, partners, send, onClose }: { g: GameState; me: Player; partners: Player[]; send: Send; onClose: () => void }) {
  const board = boardOf(g);
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? "");
  const [give, setGive] = useState<number[]>([]);
  const [take, setTake] = useState<number[]>([]);
  const [giveMoney, setGiveMoney] = useState(0);
  const [takeMoney, setTakeMoney] = useState(0);
  const partner = partners.find((p) => p.id === partnerId);

  const owned = (id: string) => board.flatMap((s, i) => (g.owners[i] === id && s.kind === "country" ? [i] : []));
  const toggle = (list: number[], set: (l: number[]) => void, i: number) => set(list.includes(i) ? list.filter((x) => x !== i) : [...list, i]);
  const clamp = (v: string, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

  const chips = (id: string, list: number[], set: (l: number[]) => void) => {
    const squares = owned(id);
    if (!squares.length) return <p className="text-sm text-slate-400">No countries yet.</p>;
    return (
      <div className="flex max-h-44 flex-wrap gap-1 overflow-y-auto">
        {squares.map((i) => {
          const s = board[i];
          if (s.kind !== "country") return null;
          const blocked = level(g, i) > 0;
          const on = list.includes(i);
          return (
            <button
              key={i}
              disabled={blocked}
              title={blocked ? "Sell the buildings first" : `${s.name} · $${s.price}`}
              onClick={() => toggle(list, set, i)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                on ? "bg-emerald-600 ring-2 ring-emerald-300" : "bg-white/10 hover:bg-white/20"
              } disabled:cursor-not-allowed disabled:opacity-30`}
            >
              <Flag iso={s.iso} name={s.name} className="w-5" /> {s.name} <span className="text-slate-300">${s.price}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const empty = !give.length && !take.length && !giveMoney && !takeMoney;
  const send_ = () => {
    send({ type: "PROPOSE_TRADE", to: partnerId, give, take, giveMoney, takeMoney });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="pop max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-900 p-5 text-white shadow-2xl ring-1 ring-white/15" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-bold">🤝 Make a deal</h3>
          <button onClick={onClose} className="rounded-full bg-white/10 px-2 py-0.5 hover:bg-white/20" aria-label="Close">✕</button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-300">Deal with:</span>
          {partners.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPartnerId(p.id); setTake([]); setTakeMoney(0); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${p.id === partnerId ? "bg-indigo-600 ring-2 ring-indigo-300" : "bg-white/10 hover:bg-white/20"}`}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: p.color }} /> {p.name}
            </button>
          ))}
        </div>

        {partner && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-white/5 p-3">
              <div className="font-semibold text-rose-300">You give</div>
              {chips(me.id, give, setGive)}
              <label className="flex items-center gap-2 text-sm">
                Money $
                <input
                  type="number" min={0} max={me.money} step={10} value={giveMoney || ""} placeholder="0"
                  onChange={(e) => setGiveMoney(clamp(e.target.value, me.money))}
                  className="w-28 rounded-md border border-white/15 bg-slate-800 px-2 py-1 text-white"
                />
                <span className="text-xs text-slate-400">(you have ${me.money})</span>
              </label>
            </div>
            <div className="space-y-2 rounded-xl bg-white/5 p-3">
              <div className="font-semibold text-emerald-300">You get from {partner.name}</div>
              {chips(partner.id, take, setTake)}
              <label className="flex items-center gap-2 text-sm">
                Money $
                <input
                  type="number" min={0} max={partner.money} step={10} value={takeMoney || ""} placeholder="0"
                  onChange={(e) => setTakeMoney(clamp(e.target.value, partner.money))}
                  className="w-28 rounded-md border border-white/15 bg-slate-800 px-2 py-1 text-white"
                />
                <span className="text-xs text-slate-400">(they have ${partner.money})</span>
              </label>
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400">
          Money is optional on both sides: you can swap countries only, give a country as a gift, or buy one with cash.
          Countries with houses or hotels can't be traded.
        </p>
        <button
          disabled={empty || !partner}
          onClick={send_}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send offer
        </button>
      </div>
    </div>
  );
}
