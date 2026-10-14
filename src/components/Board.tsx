import { useEffect, useState } from "react";
import { BOARD, GROUP_COLORS, MAX_BUILD_LEVEL, level, type GameState } from "../../shared/game";
import { Flag, Shape } from "./CountryArt";

// Square index -> [row, col] on an 11x11 grid, running clockwise from Go (bottom-right).
function cell(i: number): [number, number] {
  if (i <= 10) return [11, 11 - i];
  if (i <= 20) return [11 - (i - 10), 1];
  if (i <= 30) return [1, 1 + (i - 20)];
  return [1 + (i - 30), 11];
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
function Dice({ dice, rolling }: { dice: [number, number] | null; rolling: boolean }) {
  const [faces, setFaces] = useState<[number, number]>([1, 1]);
  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setFaces([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]), 90);
    return () => clearInterval(t);
  }, [rolling]);
  if (!dice && !rolling) return null;
  const [a, b] = rolling ? faces : dice!;
  return (
    <div style={{ fontSize: "8cqw" }} className={`relative flex gap-[1cqw] leading-none ${rolling ? "dice-roll" : "pop"}`}>
      <span>{DICE[a]}</span>
      <span>{DICE[b]}</span>
    </div>
  );
}

export default function Board({ g, shown, rolling, onSelect, children }: Props) {
  const byId = new Map(g.players.map((p) => [p.id, p]));
  return (
    <div className="@container relative mx-auto grid aspect-square w-full max-w-[720px] grid-cols-11 grid-rows-11 gap-[2px] rounded-2xl bg-slate-950 p-[3px] shadow-2xl ring-1 ring-white/10">
      {BOARD.map((s, i) => {
        const [row, col] = cell(i);
        const owner = g.owners[i] ? byId.get(g.owners[i]) : undefined;
        const here = g.players.filter((p) => (shown[p.id] ?? p.pos) === i && !p.bankrupt);
        const lvl = level(g, i);
        const pos = { gridRow: row, gridColumn: col, fontSize: "1.35cqw" } as const;

        const tokens = (
          <div className="absolute inset-x-0 bottom-[0.6cqw] z-10 flex flex-wrap items-center justify-center gap-[0.2cqw]">
            {here.map((p) => (
              <span
                key={p.id}
                title={p.name}
                className="hop flex items-center justify-center rounded-full font-bold text-white shadow ring-[0.2cqw] ring-white"
                style={{ background: p.color, width: "2.6cqw", height: "2.6cqw", fontSize: "1.5cqw" }}
              >
                {p.name[0]?.toUpperCase()}
              </span>
            ))}
          </div>
        );

        if (s.kind !== "country") {
          return (
            <div
              key={i}
              style={pos}
              className="relative flex flex-col items-center justify-center overflow-hidden rounded-[4px] bg-gradient-to-br from-slate-700 to-slate-800 text-center font-semibold text-slate-100"
            >
              <span style={{ fontSize: "3.4cqw" }} className="leading-none">{s.icon}</span>
              <span className="mt-[0.3cqw] @max-[500px]:hidden">{s.name}</span>
              {s.kind === "parking" && g.settings.freeParkingPot && g.pot > 0 && (
                <span className="text-amber-300">${g.pot}</span>
              )}
              {tokens}
            </div>
          );
        }

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              ...pos,
              background: `linear-gradient(160deg, ${s.colors[0]}2e, ${s.colors[1]}33 80%), #f8fafc`,
            }}
            className="relative flex flex-col items-center overflow-hidden rounded-[4px] text-center text-slate-800 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {/* owner bar: lights up in the buyer's color the moment someone buys this country */}
            <div
              key={owner?.id ?? "free"}
              title={owner ? `Owned by ${owner.name}` : "Not owned"}
              className={`relative z-10 w-full ${owner ? "owner-bar" : ""}`}
              style={{ height: "1.9cqw", background: owner ? owner.color : "transparent", boxShadow: owner ? `0 0 1.2cqw ${owner.color}` : undefined }}
            />
            {/* silhouette of the country in its flag color */}
            <Shape
              iso={s.iso}
              color={s.colors[0]}
              opacity={0.6}
              className="pointer-events-none absolute bottom-[1%] left-[6%] h-[88%] w-[88%]"
            />
            {/* color-set band; shows houses / hotel once built */}
            <div className="relative flex h-[1.5cqw] w-full items-center justify-center gap-[0.25cqw]" style={{ background: GROUP_COLORS[s.group] }}>
              {lvl === MAX_BUILD_LEVEL ? (
                <span className="h-[1cqw] w-[2.4cqw] rounded-[2px] bg-red-600 ring-1 ring-white" title="Hotel" />
              ) : (
                Array.from({ length: lvl }, (_, k) => (
                  <span key={k} className="h-[1.1cqw] w-[1.1cqw] rounded-[2px] bg-emerald-400 ring-1 ring-white" />
                ))
              )}
            </div>
            <Flag iso={s.iso} name={s.name} className="relative mt-[0.25cqw] w-[42%]" />
            <span
              className="relative mt-[0.2cqw] max-w-full truncate px-[2px] font-extrabold leading-none text-slate-900 [text-shadow:0_0_3px_#fff,0_0_3px_#fff] @max-[500px]:hidden"
              style={{ fontSize: "1.35cqw" }}
            >
              {s.name}
            </span>
            {/* price is always visible under the country */}
            <span
              className="relative mt-[0.1cqw] font-extrabold leading-none text-slate-900 [text-shadow:0_0_3px_#fff,0_0_3px_#fff]"
              style={{ fontSize: "max(7px, 1.45cqw)" }}
            >
              ${s.price}
            </span>
            <div className="absolute inset-x-0 top-[28%] z-10 flex flex-wrap items-center justify-center gap-[0.2cqw]">
              {here.map((p) => (
                <span
                  key={p.id}
                  title={p.name}
                  className="hop flex items-center justify-center rounded-full font-bold text-white shadow ring-[0.2cqw] ring-white"
                  style={{ background: p.color, width: "2.6cqw", height: "2.6cqw", fontSize: "1.5cqw" }}
                >
                  {p.name[0]?.toUpperCase()}
                </span>
              ))}
            </div>
          </button>
        );
      })}

      <div
        style={{ gridRow: "2 / 11", gridColumn: "2 / 11" }}
        className="relative flex flex-col items-center justify-center gap-[1.5cqw] overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 p-[2cqw] text-center text-white"
      >
        <div className="pointer-events-none absolute -bottom-[8cqw] -right-[8cqw] text-[40cqw] leading-none opacity-[0.06]">🌍</div>
        <div style={{ fontSize: "3cqw" }} className="relative font-extrabold tracking-wide text-sky-200">COUNTRIES MONOPOLY</div>
        <Dice dice={g.dice} rolling={rolling} />
        <div className="relative flex flex-col items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

