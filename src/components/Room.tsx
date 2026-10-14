import { useState } from "react";
import {
  BOARD, MAX_PLAYERS, MIN_PLAYERS, START_MONEY, currentPlayer, rentMultiplier,
  type GameState, type Player,
} from "../../shared/game";
import { useGame } from "../lib/useGame";
import Board from "./Board";

type Props = { code: string; name: string; onLeave: () => void };

const btn =
  "rounded-lg px-4 py-2 font-semibold text-white shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed";

export default function Room({ code, name, onLeave }: Props) {
  const { state: g, myId, connected, error, send } = useGame(code, name);
  const [copied, setCopied] = useState(false);

  if (!g || !myId) {
    return (
      <Shell code={code} onLeave={onLeave}>
        <p className="py-20 text-center text-slate-500">{connected ? "Joining room…" : "Connecting to server…"}</p>
      </Shell>
    );
  }

  const me = g.players.find((p) => p.id === myId);
  if (!me) {
    return (
      <Shell code={code} onLeave={onLeave}>
        <div className="mx-auto max-w-sm py-16 text-center">
          <p className="text-lg font-semibold">Can't join this room</p>
          <p className="mt-1 text-slate-500">The game has already started or the room is full.</p>
          <button onClick={onLeave} className={`${btn} mt-5 bg-indigo-600`}>Back</button>
        </div>
      </Shell>
    );
  }

  const link = `${location.origin}${location.pathname}?room=${code}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <Shell code={code} onLeave={onLeave} onCopy={copy} copied={copied}>
      {error && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {error}
        </div>
      )}
      {!connected && <div className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">Reconnecting…</div>}
      {g.phase === "lobby" ? <Lobby g={g} me={me} send={send} /> : <Game g={g} me={me} send={send} onLeave={onLeave} />}
    </Shell>
  );
}

function Shell(props: { code: string; onLeave: () => void; onCopy?: () => void; copied?: boolean; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <button onClick={props.onLeave} className="text-sm text-slate-500 hover:text-slate-900">← Leave</button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Room</span>
          <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-sm tracking-widest text-white">{props.code}</span>
          {props.onCopy && (
            <button onClick={props.onCopy} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-50">
              {props.copied ? "Copied!" : "Copy link"}
            </button>
          )}
        </div>
      </header>
      {props.children}
    </div>
  );
}

type Send = ReturnType<typeof useGame>["send"];

function Lobby({ g, me, send }: { g: GameState; me: Player; send: Send }) {
  const isHost = g.hostId === me.id;
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-bold">Waiting for players</h2>
      <p className="mt-1 text-sm text-slate-500">
        Share the room code <b className="font-mono">{g.code}</b> or the link. {MIN_PLAYERS}–{MAX_PLAYERS} players.
      </p>
      <ul className="mt-4 space-y-2">
        {g.players.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
            <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
            <span className="flex-1 font-medium">{p.name}{p.id === me.id && " (you)"}</span>
            {p.id === g.hostId && <span className="text-xs text-indigo-600">host</span>}
            {p.isBot && <span className="text-xs text-slate-400">🤖 bot</span>}
          </li>
        ))}
      </ul>
      {isHost ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button className={`${btn} bg-slate-700`} disabled={g.players.length >= MAX_PLAYERS} onClick={() => send({ type: "ADD_BOT" })}>
            + Add bot
          </button>
          <button className={`${btn} flex-1 bg-indigo-600`} disabled={g.players.length < MIN_PLAYERS} onClick={() => send({ type: "START" })}>
            Start game
          </button>
        </div>
      ) : (
        <p className="mt-5 text-center text-sm text-slate-500">Waiting for the host to start…</p>
      )}
    </div>
  );
}

function Game({ g, me, send, onLeave }: { g: GameState; me: Player; send: Send; onLeave: () => void }) {
  const cur = currentPlayer(g);
  const myTurn = cur.id === me.id && g.phase !== "over" && !me.bankrupt;
  const winner = g.players.find((p) => p.id === g.winnerId);
  const buy = g.canBuy !== null ? BOARD[g.canBuy] : null;
  const mult = rentMultiplier(g);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Board g={g}>
        {g.phase === "over" ? (
          <>
            <div className="text-3xl">🏆</div>
            <div className="text-lg font-extrabold">{winner?.name} wins!</div>
            <button onClick={onLeave} className={`${btn} bg-indigo-600`}>Back to lobby</button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold sm:text-base">
              <span className="h-3 w-3 rounded-full" style={{ background: cur.color }} />
              {myTurn ? "Your turn!" : `${cur.name}'s turn`}
              {cur.isBot && " 🤖"}
              {!cur.connected && " (offline)"}
            </div>
            {myTurn && g.phase === "roll" && (
              <button onClick={() => send({ type: "ROLL" })} className={`${btn} bg-indigo-600 text-base`}>🎲 Roll dice</button>
            )}
            {myTurn && g.phase === "action" && (
              <div className="flex flex-wrap justify-center gap-2">
                {buy && buy.kind === "country" && (
                  <button onClick={() => send({ type: "BUY" })} className={`${btn} bg-emerald-600`}>
                    Buy {buy.flag} {buy.name} ${buy.price}
                  </button>
                )}
                <button onClick={() => send({ type: "END_TURN" })} className={`${btn} bg-slate-700`}>
                  {g.extraRoll ? "Roll again" : "End turn"}
                </button>
              </div>
            )}
            {!myTurn && me.bankrupt && <div className="text-sm text-red-600">You are bankrupt — spectating.</div>}
            {mult > 1 && <div className="text-xs text-rose-600">Rent inflation ×{mult.toFixed(2)}</div>}
          </>
        )}
      </Board>

      <aside className="space-y-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-2 font-bold">Players</h3>
          <ul className="space-y-3">
            {g.players.map((p) => {
              const owned = BOARD.flatMap((s, i) => (g.owners[i] === p.id && s.kind === "country" ? [s] : []));
              return (
                <li key={p.id} className={p.bankrupt ? "opacity-40" : ""}>
                  <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${p.id === cur.id && g.phase !== "over" ? "bg-indigo-50 ring-1 ring-indigo-300" : ""}`}>
                    <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 truncate font-medium">
                      {p.name}{p.id === me.id && " (you)"}{p.isBot && " 🤖"}{p.jailed && " 🔒"}
                    </span>
                    <span className="font-mono font-semibold">{p.bankrupt ? "OUT" : `$${p.money}`}</span>
                  </div>
                  {owned.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 pl-6 text-sm">
                      {owned.map((s) => (
                        <span key={s.name} title={`${s.name} — rent $${s.rent}`} className="rounded bg-slate-100 px-1.5 py-0.5">
                          {s.flag} {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Start: ${START_MONEY} · Owning a whole color set doubles its rent.</p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-2 font-bold">Log</h3>
          <ul className="flex max-h-56 flex-col-reverse gap-1 overflow-y-auto text-sm text-slate-700">
            {[...g.log].reverse().map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>
      </aside>
    </div>
  );
}
