import { useEffect, useState } from "react";
import { MAX_BUILD_LEVEL, TEAMS, boardOf, groupColor, level, sideLength, type GameState } from "../../shared/game";
import { Flag, Shape } from "./CountryArt";

// Square index -> [row, col] on an N x N grid (N = side + 1), running clockwise from Go (bottom-right).
function cell(i: number, side: number): [number, number] {
  const n = side + 1;
  if (i <= side) return [n, n - i];
  if (i <= 2 * side) return [n - (i - side), 1];
  if (i <= 3 * side) return [1, 1 + (i - 2 * side)];
  return [1 + (i - 3 * side), n];
}

const DICE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

type Props = {
  g: GameState;
  shown: Record<string, number>; // animated piece positions
  rolling: boolean;
  onSelect: (i: number) => void;
  children: React.ReactNode;
};

/** Two dice that tumble through random faces while `rolling`, then settle on the real roll. */
function Dice({ dice, rolling, size }: { dice: [number, number] | null; rolling: boolean; size: string }) {
  const [faces, setFaces] = useState<[number, number]>([1, 1]);
  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setFaces([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]), 90);
    return () => clearInterval(t);
  }, [rolling]);
  if (!dice && !rolling) return null;
  const [a, b] = rolling ? faces : dice!;
  return (
    <div style={{ fontSize: size }} className={`relative flex gap-[0.15em] leading-none ${rolling ? "dice-roll" : "pop"}`}>
      <span>{DICE[a]}</span>
      <span>{DICE[b]}</span>
    </div>
  );
}

export default function Board({ g, shown, rolling, onSelect, children }: Props) {
  const board = boardOf(g);
  const side = sideLength(board);
  const n = side + 1;
  const big = g.settings.teamMode;
  // all sizes below are written for the 11x11 classic board; `k` shrinks them for the big board
  const k = big ? 0.62 : 1;
  const q = (x: number) => `calc(${x}cqw * ${k})`;
  const byId = new Map(g.players.map((p) => [p.id, p]));

  const token = (p: GameState["players"][number]) => (
    <span
      key={p.id}
      title={p.name}
      className="hop flex items-center justify-center rounded-full font-bold text-white"
      style={{
        background: p.color,
        width: q(2.6),
        height: q(2.6),
        fontSize: q(1.5),
        boxShadow: g.settings.teamMode
          ? `0 0 0 ${q(0.2)} #fff, 0 0 0 ${q(0.6)} ${TEAMS[p.team]?.color ?? "#fff"}`
          : `0 0 0 ${q(0.2)} #fff, 0 1px 3px rgba(0,0,0,.5)`,
      }}
    >
      {p.name[0]?.toUpperCase()}
    </span>
  );

  return (
    <div
      className={`@container relative mx-auto grid aspect-square w-full rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-white/10 ${
        big ? "min-w-[780px] max-w-[1100px]" : "max-w-[720px]"
      }`}
      style={{
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
        gap: "2px",
        padding: "3px",
      }}
    >
      {board.map((s, i) => {
        const [row, col] = cell(i, side);
        const owner = g.owners[i] ? byId.get(g.owners[i]) : undefined;
        const here = g.players.filter((p) => (shown[p.id] ?? p.pos) === i && !p.bankrupt);
        const lvl = level(g, i);
        const pos = { gridRow: row, gridColumn: col, fontSize: q(1.35) } as const;

        if (s.kind !== "country") {
          return (
            <div
              key={i}
              style={pos}
              className="relative flex flex-col items-center justify-center overflow-hidden rounded-[4px] bg-gradient-to-br from-slate-700 to-slate-800 text-center font-semibold text-slate-100"
            >
              <span style={{ fontSize: q(3.4) }} className="leading-none">{s.icon}</span>
              <span style={{ marginTop: q(0.3) }} className={big ? "@max-[700px]:hidden" : "@max-[500px]:hidden"}>{s.name}</span>
              {s.kind === "parking" && g.settings.freeParkingPot && g.pot > 0 && <span className="text-amber-300">${g.pot}</span>}
              <div className="absolute inset-x-0 flex flex-wrap items-center justify-center" style={{ bottom: q(0.6), gap: q(0.2) }}>
                {here.map(token)}
              </div>
            </div>
          );
        }

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            title={`${s.name} · ${s.price}`}
            style={{ ...pos, background: `linear-gradient(160deg, ${s.colors[0]}2e, ${s.colors[1]}33 80%), #f8fafc` }}
            className="relative flex flex-col items-center overflow-hidden rounded-[4px] text-center text-slate-800 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {/* owner bar: lights up in the buyer's color the moment someone buys this country */}
            <div
              key={owner?.id ?? "free"}
              title={owner ? `Owned by ${owner.name}` : "Not owned"}
              className={`relative z-10 w-full ${owner ? "owner-bar" : ""}`}
              style={{ height: q(1.9), background: owner ? owner.color : "transparent", boxShadow: owner ? `0 0 ${q(1.2)} ${owner.color}` : undefined }}
            />
            {/* silhouette of the country in its flag color */}
            <Shape iso={s.iso} color={s.colors[0]} opacity={0.6} className="pointer-events-none absolute bottom-[1%] left-[6%] h-[88%] w-[88%]" />
            {/* color-set band; shows houses / hotel once built */}
            <div className="relative flex w-full items-center justify-center" style={{ height: q(1.5), gap: q(0.25), background: groupColor(board, s.group) }}>
              {lvl === MAX_BUILD_LEVEL ? (
                <span className="rounded-[2px] bg-red-600 ring-1 ring-white" style={{ height: q(1), width: q(2.4) }} title="Hotel" />
              ) : (
                Array.from({ length: lvl }, (_, j) => (
                  <span key={j} className="rounded-[2px] bg-emerald-400 ring-1 ring-white" style={{ height: q(1.1), width: q(1.1) }} />
                ))
              )}
            </div>
            <Flag iso={s.iso} name={s.name} className="relative" style={{ marginTop: q(0.25), width: big ? "68%" : "42%" }} />
            <span
              className={`relative max-w-full truncate px-[2px] font-extrabold leading-none text-slate-900 [text-shadow:0_0_3px_#fff,0_0_3px_#fff] ${
                big ? "hidden" : "@max-[500px]:hidden"
              }`}
              style={{ marginTop: q(0.2), fontSize: q(1.35) }}
            >
              {s.name}
            </span>
            {/* price is always visible under the country */}
            <span
              className="relative font-extrabold leading-none text-slate-900 [text-shadow:0_0_3px_#fff,0_0_3px_#fff]"
              style={{ marginTop: q(0.1), fontSize: `max(7px, ${q(1.45)})` }}
            >
              ${s.price}
            </span>
            <div className="absolute inset-x-0 z-10 flex flex-wrap items-center justify-center" style={{ top: "28%", gap: q(0.2) }}>
              {here.map(token)}
            </div>
          </button>
        );
      })}

      <div
        style={{ gridRow: `2 / ${n}`, gridColumn: `2 / ${n}`, padding: q(2), gap: q(1.5) }}
        className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 text-center text-white"
      >
        <div className="pointer-events-none absolute -bottom-[8cqw] -right-[8cqw] text-[40cqw] leading-none opacity-[0.06]">🌍</div>
        <div style={{ fontSize: q(3) }} className="relative font-extrabold tracking-wide text-sky-200">
          COUNTRIES MONOPOLY{big && " · TEAMS"}
        </div>
        <Dice dice={g.dice} rolling={rolling} size={q(8)} />
        <div className={`relative flex flex-col items-center gap-2 ${big ? "@min-[900px]:[zoom:1.4]" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
