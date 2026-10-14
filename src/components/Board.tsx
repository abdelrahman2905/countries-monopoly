import { BOARD, GROUP_COLORS, type GameState } from "../../shared/game";

// Square index -> [row, col] on a 9x9 grid, running clockwise from Go (bottom-right).
function cell(i: number): [number, number] {
  if (i <= 8) return [9, 9 - i];
  if (i <= 16) return [9 - (i - 8), 1];
  if (i <= 24) return [1, 1 + (i - 16)];
  return [1 + (i - 24), 9];
}

const DICE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function Board({ g, children }: { g: GameState; children: React.ReactNode }) {
  const byId = new Map(g.players.map((p) => [p.id, p]));
  return (
    <div
      className="relative mx-auto grid aspect-square w-full max-w-[680px] grid-cols-9 grid-rows-9 gap-[2px] rounded-2xl bg-slate-300 p-[2px] shadow-md [container-type:inline-size]"
    >
      {BOARD.map((s, i) => {
        const [row, col] = cell(i);
        const owner = g.owners[i] ? byId.get(g.owners[i]) : undefined;
        const here = g.players.filter((p) => p.pos === i && !p.bankrupt);
        const corner = i % 8 === 0;
        return (
          <div
            key={i}
            style={{
              gridRow: row, gridColumn: col, fontSize: "1.7cqw",
              boxShadow: owner ? `inset 0 0 0 0.45cqw ${owner.color}` : undefined,
            }}
            className={`relative flex flex-col items-center justify-between overflow-hidden rounded-[3px] bg-white text-center leading-tight ${
              corner ? "bg-slate-50 font-bold" : ""
            }`}
          >
            {s.kind === "country" && (
              <div className="h-[1.2cqw] w-full" style={{ background: GROUP_COLORS[s.group] }} />
            )}
            <div className="flex flex-1 flex-col items-center justify-center px-[2px]">
              <span style={{ fontSize: "3.6cqw" }} className="leading-none">
                {s.kind === "country" ? s.flag : s.icon}
              </span>
              <span className="mt-[2px] max-w-full truncate">{s.name}</span>
              {s.kind === "country" && <span className="text-slate-500">${s.price}</span>}
            </div>
            <div className="flex min-h-[2.6cqw] flex-wrap items-center justify-center gap-[2px] pb-[2px]">
              {here.map((p) => (
                <span
                  key={p.id}
                  title={p.name}
                  className="pop flex items-center justify-center rounded-full font-bold text-white ring-1 ring-white"
                  style={{ background: p.color, width: "2.6cqw", height: "2.6cqw", fontSize: "1.5cqw" }}
                >
                  {p.name[0]?.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      <div
        style={{ gridRow: "2 / 9", gridColumn: "2 / 9" }}
        className="flex flex-col items-center justify-center gap-[1.5cqw] rounded-xl bg-gradient-to-br from-sky-50 to-indigo-100 p-[2cqw] text-center"
      >
        <div style={{ fontSize: "3cqw" }} className="font-extrabold text-indigo-900">🌍 Countries Monopoly</div>
        {g.dice && (
          <div style={{ fontSize: "9cqw" }} className="pop leading-none">
            {DICE[g.dice[0]]} {DICE[g.dice[1]]}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
