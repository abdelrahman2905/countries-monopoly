import { useEffect, useState } from "react";
import { BOARD, MIN_PLAYERS, currentPlayer, groupSquares, level, rentMultiplier, salaryFor, MAX_BUILD_LEVEL, type GameState, type Player } from "../../shared/game";
import { useGame } from "../lib/useGame";
import Board from "./Board";
import { Flag } from "./CountryArt";
import ProfilePicker from "./ProfilePicker";
import PropertyModal from "./PropertyModal";
import SettingsPanel from "./SettingsPanel";

type Props = { code: string; name: string; onLeave: () => void };

const btn =
  "rounded-lg px-4 py-2 font-semibold text-white shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed";
const card = "rounded-2xl bg-slate-900/80 p-4 text-white shadow-lg ring-1 ring-white/10 backdrop-blur";

export default function Room({ code, name, onLeave }: Props) {
  const { state: g, myId, connected, error, send } = useGame(code, name);
  const [copied, setCopied] = useState(false);

  if (!g || !myId) {
    return (
      <Shell code={code} onLeave={onLeave}>
        <p className="py-20 text-center text-slate-400">{connected ? "Joining room…" : "Connecting to server…"}</p>
      </Shell>
    );
  }

  const me = g.players.find((p) => p.id === myId);
  if (!me) {
    return (
      <Shell code={code} onLeave={onLeave}>
        <div className="mx-auto max-w-sm py-16 text-center text-white">
          <p className="text-lg font-semibold">Can't join this room</p>
          <p className="mt-1 text-slate-400">The game has already started or the room is full.</p>
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
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">{error}</div>
      )}
      {!connected && <div className="mb-3 rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-200">Reconnecting…</div>}
      {g.phase === "lobby" ? <Lobby g={g} me={me} send={send} /> : <Game g={g} me={me} send={send} onLeave={onLeave} />}
    </Shell>
  );
}

function Shell(props: { code: string; onLeave: () => void; onCopy?: () => void; copied?: boolean; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <button onClick={props.onLeave} className="text-sm text-slate-400 hover:text-white">← Leave</button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Room</span>
          <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-sm tracking-widest text-white">{props.code}</span>
          {props.onCopy && (
            <button onClick={props.onCopy} className="rounded-md border border-white/15 px-2 py-1 text-sm text-white hover:bg-white/10">
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
    <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
      <section className={card}>
        <h2 className="text-xl font-bold">Players</h2>
        <p className="mt-1 text-sm text-slate-400">
          Share the code <b className="font-mono text-white">{g.code}</b> or the link. {MIN_PLAYERS}–{g.settings.maxPlayers} players.
        </p>
        <div className="mt-4">
          <ProfilePicker me={me} taken={new Set(g.players.map((p) => p.color))} onChange={(patch) => send({ type: "SET_PROFILE", ...patch })} />
        </div>
        <ul className="mt-4 space-y-2">
          {g.players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
              <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
              <span className="flex-1 font-medium">{p.name}{p.id === me.id && " (you)"}</span>
              {p.id === g.hostId && <span className="text-xs text-indigo-300">host</span>}
              {p.isBot && <span className="text-xs text-slate-400">🤖 bot</span>}
            </li>
          ))}
        </ul>
        {isHost ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <button className={`${btn} bg-slate-700`} disabled={g.players.length >= g.settings.maxPlayers} onClick={() => send({ type: "ADD_BOT" })}>
              + Add bot
            </button>
            <button className={`${btn} flex-1 bg-indigo-600 hover:bg-indigo-500`} disabled={g.players.length < MIN_PLAYERS} onClick={() => send({ type: "START" })}>
              Start game
            </button>
          </div>
        ) : (
          <p className="mt-5 text-center text-sm text-slate-400">Waiting for the host to start…</p>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-3 text-xl font-bold">Room settings</h2>
        <SettingsPanel settings={g.settings} editable={isHost} onChange={(settings) => send({ type: "SET_SETTINGS", settings })} />
      </section>
    </div>
  );
}

function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));
  return <div className={`text-xs ${left <= 10 ? "text-red-300" : "text-slate-300"}`}>⏱ {left}s left</div>;
}

function Game({ g, me, send, onLeave }: { g: GameState; me: Player; send: Send; onLeave: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const cur = currentPlayer(g);
  const myTurn = cur.id === me.id && g.phase !== "over" && !me.bankrupt;
  const winner = g.players.find((p) => p.id === g.winnerId);
  const buy = g.canBuy !== null ? BOARD[g.canBuy] : null;
  const mult = rentMultiplier(g);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Board g={g} onSelect={setSelected}>
        {g.phase === "over" ? (
          <>
            <div className="text-4xl">🏆</div>
            <div className="text-xl font-extrabold">{winner?.name} wins!</div>
            <button onClick={onLeave} className={`${btn} bg-indigo-600`}>Back to lobby</button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold sm:text-lg">
              <span className="h-3 w-3 rounded-full ring-2 ring-white/70" style={{ background: cur.color }} />
              {myTurn ? "Your turn!" : `${cur.name}'s turn`}
              {cur.isBot && " 🤖"}
              {!cur.connected && " (offline)"}
            </div>
            {myTurn && g.phase === "roll" && (
              <button onClick={() => send({ type: "ROLL" })} className={`${btn} bg-indigo-500 text-base hover:bg-indigo-400 sm:text-lg`}>🎲 Roll dice</button>
            )}
            {myTurn && g.phase === "action" && (
              <div className="flex flex-wrap justify-center gap-2">
                {buy && buy.kind === "country" && (
                  <button onClick={() => send({ type: "BUY" })} className={`${btn} flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500`}>
                    <Flag iso={buy.iso} name={buy.name} className="w-6" /> Buy {buy.name} ${buy.price}
                  </button>
                )}
                <button onClick={() => send({ type: "END_TURN" })} className={`${btn} bg-slate-600 hover:bg-slate-500`}>
                  {g.extraRoll ? "Roll again" : "End turn"}
                </button>
              </div>
            )}
            {!myTurn && me.bankrupt && <div className="text-sm text-red-300">You are bankrupt, spectating.</div>}
            {g.turnDeadline && <Countdown deadline={g.turnDeadline} />}
            <div className="text-xs text-emerald-300">🏁 Passing Go pays ${salaryFor(g)}</div>
            {g.settings.freeParkingPot && g.pot > 0 && <div className="text-xs text-amber-300">🅿️ Jackpot ${g.pot}</div>}
            {mult > 1 && <div className="text-xs text-rose-300">Rent inflation ×{mult.toFixed(2)}</div>}
            <div className="text-xs text-slate-400">Tap any country for details{g.settings.buildings ? " and to build" : ""}.</div>
          </>
        )}
      </Board>

      <aside className="space-y-4">
        <section className={card}>
          <h3 className="mb-2 font-bold">Players</h3>
          <ul className="space-y-3">
            {g.players.map((p) => {
              const owned = BOARD.flatMap((s, i) => (g.owners[i] === p.id && s.kind === "country" ? [{ s, i }] : []));
              return (
                <li key={p.id} className={p.bankrupt ? "opacity-40" : ""}>
                  <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${p.id === cur.id && g.phase !== "over" ? "bg-indigo-500/20 ring-1 ring-indigo-400" : ""}`}>
                    <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 truncate font-medium">
                      {p.name}{p.id === me.id && " (you)"}{p.isBot && " 🤖"}{p.jailed && " 🔒"}
                    </span>
                    <span className="font-mono font-semibold">{p.bankrupt ? "OUT" : `$${p.money}`}</span>
                  </div>
                  {owned.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 pl-6 text-xs">
                      {owned.map(({ s, i }) => {
                        if (s.kind !== "country") return null;
                        const lvl = level(g, i);
                        const full = groupSquares(s.group).every((x) => g.owners[x] === p.id);
                        return (
                          <button
                            key={i}
                            onClick={() => setSelected(i)}
                            className={`flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 hover:bg-white/20 ${full ? "ring-1 ring-emerald-400" : ""}`}
                            title={full ? "You own the whole set" : s.name}
                          >
                            <Flag iso={s.iso} name={s.name} className="w-4" />
                            {s.name}
                            {lvl > 0 && <span>{lvl === MAX_BUILD_LEVEL ? "🏨" : "🏠".repeat(lvl)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className={card}>
          <h3 className="mb-2 font-bold">Log</h3>
          <ul className="flex max-h-56 flex-col-reverse gap-1 overflow-y-auto text-sm text-slate-300">
            {[...g.log].reverse().map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>
      </aside>

      {selected !== null && (
        <PropertyModal
          g={g}
          index={selected}
          myId={me.id}
          myTurn={myTurn}
          onClose={() => setSelected(null)}
          onBuild={() => send({ type: "BUILD", square: selected })}
          onSell={() => send({ type: "SELL", square: selected })}
        />
      )}
    </div>
  );
}
