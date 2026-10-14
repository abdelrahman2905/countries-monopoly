import { useEffect, useState } from "react";
import { GIVE_AMOUNTS, MAX_BUILD_LEVEL, MIN_PLAYERS, TEAMS, boardOf, currentPlayer, groupColor, groupSquares, level, type GameState, type Player } from "../../shared/game";
import { useGame } from "../lib/useGame";
import { useBoardAnimation } from "../lib/useBoardAnimation";
import { MAX_ZOOM, MIN_ZOOM, useBoardZoom } from "../lib/useBoardZoom";
import BankCard from "./BankCard";
import Board from "./Board";
import TradePanel from "./TradePanel";
import TurnPanel from "./TurnPanel";
import { Flag } from "./CountryArt";
import ProfilePicker from "./ProfilePicker";
import PropertyModal from "./PropertyModal";
import SetsCard from "./SetsCard";
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
    <Shell code={code} onLeave={onLeave} onCopy={copy} copied={copied} wide={g.settings.teamMode && g.phase !== "lobby"}>
      {error && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">{error}</div>
      )}
      {!connected && <div className="mb-3 rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-200">Reconnecting…</div>}
      {g.phase === "lobby" ? <Lobby g={g} me={me} send={send} /> : <Game g={g} me={me} send={send} onLeave={onLeave} />}
    </Shell>
  );
}

function Shell(props: { code: string; onLeave: () => void; onCopy?: () => void; copied?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`mx-auto w-full px-3 py-4 sm:px-6 ${props.wide ? "max-w-[2000px]" : "max-w-[1700px]"}`}>
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
          <ProfilePicker me={me} taken={new Set(g.players.map((p) => p.color))} teams={g.settings.teamMode ? g.settings.teamCount : 0} onChange={(patch) => send({ type: "SET_PROFILE", ...patch })} />
        </div>
        <ul className="mt-4 space-y-2">
          {g.players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
              <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
              <span className="flex-1 font-medium">{p.name}{p.id === me.id && " (you)"}</span>
              {g.settings.teamMode && (
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: TEAMS[p.team]?.color }}>
                  {TEAMS[p.team]?.name}
                </span>
              )}
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

function Game({ g, me, send, onLeave }: { g: GameState; me: Player; send: Send; onLeave: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const anim = useBoardAnimation(g);
  const z = useBoardZoom(g.settings.teamMode, boardOf(g).length);
  const [follow, setFollow] = useState(true);
  const cur = currentPlayer(g);
  // the big map is wider than a phone: start centered so the action buttons in the middle are in view
  useEffect(() => {
    const el = z.wrapRef.current;
    if (el && z.zoom === 1 && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [g.settings.teamMode, z.boardW]);
  // when zoomed in, the camera follows the piece that is moving
  const movingPos = anim.shown[cur.id] ?? cur.pos;
  useEffect(() => {
    if (follow && z.zoom > 1) z.focusSquare(movingPos);
  }, [movingPos, follow]);
  const myTurn = cur.id === me.id && g.phase !== "over" && !me.bankrupt;
  const canBorrow = myTurn && (g.phase === "roll" || g.phase === "action") && !anim.busy;

  const canGive = (p: Player) =>
    g.settings.teamMode && g.phase !== "over" && !me.bankrupt && !p.bankrupt && p.id !== me.id && p.team === me.team;

  const playerRow = (p: Player) => {
    const owned = boardOf(g)
      .flatMap((s, i) => (g.owners[i] === p.id && s.kind === "country" ? [{ s, i }] : []))
      .sort((a, b) => (a.s.kind === "country" && b.s.kind === "country" ? a.s.group - b.s.group || a.i - b.i : 0));
    return (
      <li key={p.id} className={p.bankrupt ? "opacity-40" : ""}>
        <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${p.id === cur.id && g.phase !== "over" ? "bg-indigo-500/20 ring-1 ring-indigo-400" : ""}`}>
          <span className="h-4 w-4 rounded-full" style={{ background: p.color }} />
          <span className="flex-1 truncate font-medium">
            {p.name}{p.id === me.id && " (you)"}{p.isBot && " 🤖"}{p.jailed && " 🔒"}{g.loans[p.id] && <span className="ml-1 text-xs text-rose-300" title="Owes the bank">🏦 -${g.loans[p.id].debt}</span>}
          </span>
          <span className="font-mono font-semibold">{p.bankrupt ? "OUT" : `${p.money}`}</span>
        </div>
        {canGive(p) && (
          <div className="mt-1 flex items-center gap-1 pl-6 text-xs">
            <span className="text-slate-400">🤝 Give:</span>
            {GIVE_AMOUNTS.map((amount) => (
              <button
                key={amount}
                disabled={me.money < amount}
                onClick={() => send({ type: "GIVE", to: p.id, amount })}
                className="rounded bg-white/10 px-1.5 py-0.5 font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ${amount}
              </button>
            ))}
          </div>
        )}
        {owned.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1 pl-6 text-xs">
            {owned.map(({ s, i }) => {
              if (s.kind !== "country") return null;
              const lvl = level(g, i);
              const full = groupSquares(boardOf(g), s.group).every((x) => g.owners[x] === p.id);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 hover:bg-white/20 ${full ? "ring-1 ring-emerald-400" : ""}`}
                  title={full ? "Complete color set" : s.name}
                  style={{ borderLeft: `4px solid ${groupColor(boardOf(g), s.group)}` }}
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
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-end gap-2 text-sm text-white">
          <span className="mr-auto hidden text-xs text-slate-400 sm:inline">Ctrl + scroll or pinch to zoom, drag to move around</span>
          <button onClick={z.zoomOut} disabled={z.zoom <= MIN_ZOOM} aria-label="Zoom out" className="h-8 w-8 rounded-lg bg-white/10 text-lg font-bold hover:bg-white/20 disabled:opacity-30">−</button>
          <span className="w-12 text-center font-mono">{Math.round(z.zoom * 100)}%</span>
          <button onClick={z.zoomIn} disabled={z.zoom >= MAX_ZOOM} aria-label="Zoom in" className="h-8 w-8 rounded-lg bg-white/10 text-lg font-bold hover:bg-white/20 disabled:opacity-30">+</button>
          <button onClick={z.reset} disabled={z.zoom === 1} className="rounded-lg bg-white/10 px-2.5 py-1.5 hover:bg-white/20 disabled:opacity-30">Reset</button>
          <button onClick={() => z.focusSquare(me.pos)} className="rounded-lg bg-white/10 px-2.5 py-1.5 hover:bg-white/20" title="Scroll to your piece">📍 Me</button>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300" title="While zoomed in, the view follows whoever is moving">
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="accent-indigo-500" /> Follow
          </label>
        </div>
        <div
          ref={z.wrapRef}
          {...z.dragProps}
          className={`min-w-0 overflow-auto rounded-2xl ${z.zoom > 1 ? "cursor-grab select-none" : ""}`}
          style={{ touchAction: "pan-x pan-y", maxHeight: z.zoom > 1 ? "78vh" : undefined }}
        >
          <Board g={g} shown={anim.shown} rolling={anim.rolling} width={z.boardW} onSelect={setSelected}>
            <TurnPanel g={g} me={me} busy={anim.busy} send={send} onLeave={onLeave} />
          </Board>
        </div>
      </div>

      <aside className="space-y-4">
        {g.phase !== "over" && !me.bankrupt && <TradePanel g={g} me={me} send={send} />}
        <SetsCard g={g} me={me} onSelect={setSelected} />
        {g.settings.loans && !me.bankrupt && <BankCard g={g} me={me} canAct={canBorrow} send={send} />}
        <section className={card}>
          <h3 className="mb-2 font-bold">{g.settings.teamMode ? "Teams" : "Players"}</h3>
          {g.settings.teamMode ? (
            <div className="space-y-4">
              {TEAMS.slice(0, g.settings.teamCount).map((team, ti) => {
                const members = g.players.filter((p) => p.team === ti);
                if (members.length === 0) return null;
                const cash = members.reduce((s, p) => s + (p.bankrupt ? 0 : p.money), 0);
                const lands = Object.values(g.owners).filter((o) => members.some((m) => m.id === o)).length;
                const out = members.every((p) => p.bankrupt);
                return (
                  <div key={ti} className={`rounded-xl p-2 ${out ? "opacity-40" : ""}`} style={{ boxShadow: `inset 0 0 0 2px ${team.color}` }}>
                    <div className="mb-1 flex items-center justify-between px-1 text-sm font-bold" style={{ color: team.color }}>
                      <span>{team.icon} Team {team.name}{g.winnerTeam === ti && " 🏆"}</span>
                      <span className="font-mono text-xs text-slate-300">${cash} · {lands} countries</span>
                    </div>
                    <ul className="space-y-3">{members.map((p) => playerRow(p))}</ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className="space-y-3">{g.players.map((p) => playerRow(p))}</ul>
          )}
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
