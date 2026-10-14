import { useState } from "react";
import { boardOf, groupColor, groupSquares, ownsGroup, type GameState, type Player } from "../../shared/game";
import { Flag } from "./CountryArt";

/**
 * "Collections": a player's countries grouped by color set. For every set they own something in, it shows the
 * progress, which countries are still missing, and who owns each missing one (or whether it is still free).
 */
export default function SetsCard({ g, me, onSelect }: { g: GameState; me: Player; onSelect: (i: number) => void }) {
  const [viewId, setViewId] = useState(me.id);
  const board = boardOf(g);
  const who = g.players.find((p) => p.id === viewId) ?? me;
  const byId = new Map(g.players.map((p) => [p.id, p]));

  const groups = [...new Set(board.flatMap((s) => (s.kind === "country" ? [s.group] : [])))]
    .map((gi) => {
      const squares = groupSquares(board, gi);
      const mine = squares.filter((i) => g.owners[i] === who.id).length;
      return { gi, squares, mine, complete: ownsGroup(g, who.id, gi) };
    })
    .filter((x) => x.mine > 0)
    .sort((a, b) => b.mine / b.squares.length - a.mine / a.squares.length || a.gi - b.gi);

  return (
    <section className="rounded-2xl bg-slate-900/80 p-4 text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
      <h3 className="mb-2 font-bold">🗂️ Collections</h3>
      <div className="mb-3 flex flex-wrap gap-1">
        {g.players.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewId(p.id)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${p.id === who.id ? "bg-indigo-600" : "bg-white/10 hover:bg-white/20"} ${p.bankrupt ? "opacity-40" : ""}`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            {p.id === me.id ? "Me" : p.name}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="text-sm text-slate-400">{who.id === me.id ? "You don't" : `${who.name} doesn't`} own any country yet.</p>}

      <div className="space-y-3">
        {groups.map(({ gi, squares, mine, complete }) => (
          <div key={gi} className="overflow-hidden rounded-xl bg-white/5" style={{ borderLeft: `5px solid ${groupColor(board, gi)}` }}>
            <div className="flex items-center justify-between px-3 py-1.5 text-xs">
              <span className="font-semibold">
                {mine}/{squares.length} owned
              </span>
              {complete ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">✓ Complete set{g.settings.buildings ? ": can build" : ""}</span>
              ) : (
                <span className="text-amber-300">Missing {squares.length - mine}</span>
              )}
            </div>
            <ul className="space-y-1 px-2 pb-2">
              {squares.map((i) => {
                const s = board[i];
                if (s.kind !== "country") return null;
                const owner = g.owners[i] ? byId.get(g.owners[i]) : undefined;
                const isWho = owner?.id === who.id;
                return (
                  <li key={i}>
                    <button
                      onClick={() => onSelect(i)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-white/10 ${
                        isWho ? "bg-emerald-500/10" : owner ? "" : "border border-dashed border-white/20"
                      }`}
                    >
                      <Flag iso={s.iso} name={s.name} className="w-6" />
                      <span className="flex-1 truncate">{s.name}</span>
                      {isWho ? (
                        <span className="text-xs font-semibold text-emerald-300">✓ {who.id === me.id ? "yours" : "owned"}</span>
                      ) : owner ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: owner.color }}>
                          <span className="h-2 w-2 rounded-full" style={{ background: owner.color }} />
                          {g.settings.teamMode && owner.team === who.team ? "🤝 " : ""}
                          {owner.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">free · ${s.price}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
