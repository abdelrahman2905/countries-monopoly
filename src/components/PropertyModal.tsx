import {
  BOARD, GROUP_COLORS, MAX_BUILD_LEVEL, baseRent, buildError, groupSquares, houseCost, level, ownsGroup,
  rentMultiplier, sellError, type GameState,
} from "../../shared/game";
import { Flag, Shape } from "./CountryArt";

type Props = {
  g: GameState;
  index: number;
  myId: string;
  myTurn: boolean;
  onClose: () => void;
  onBuild: () => void;
  onSell: () => void;
};

const LABELS = ["Rent", "1 house", "2 houses", "3 houses", "4 houses", "Hotel"];

export default function PropertyModal({ g, index, myId, myTurn, onClose, onBuild, onSell }: Props) {
  const s = BOARD[index];
  if (s.kind !== "country") return null;
  const owner = g.players.find((p) => p.id === g.owners[index]);
  const mono = !!owner && ownsGroup(g, owner.id, s.group);
  const lvl = level(g, index);
  const mult = rentMultiplier(g);
  const mine = owner?.id === myId;
  const bErr = mine ? buildError(g, myId, index) : null;
  const sErr = mine ? sellError(g, myId, index) : null;
  const set = groupSquares(s.group);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="pop relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden p-5 pb-4" style={{ background: `linear-gradient(150deg, ${s.colors[0]}, ${s.colors[1]}55)` }}>
          <Shape iso={s.iso} color="#ffffff" opacity={0.22} className="absolute -right-4 -top-2 h-44 w-44" />
          <div className="relative flex items-center gap-4">
            <Flag iso={s.iso} name={s.name} className="w-28" />
            <div>
              <div className="text-2xl font-extrabold leading-tight drop-shadow">{s.name}</div>
              <div className="mt-1 text-sm text-white/85">Price ${s.price}</div>
            </div>
          </div>
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-white hover:bg-black/50" aria-label="Close">✕</button>
        </div>
        <div className="h-1.5" style={{ background: GROUP_COLORS[s.group] }} />

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>Color set:</span>
            {set.map((i) => {
              const m = BOARD[i];
              return m.kind === "country" ? (
                <span key={i} title={m.name} className="inline-flex items-center gap-1">
                  <Flag iso={m.iso} name={m.name} className="w-6" />
                  <span className={i === index ? "font-semibold text-white" : ""}>{m.name}</span>
                  {g.owners[i] && <span className="h-2 w-2 rounded-full" style={{ background: g.players.find((p) => p.id === g.owners[i])?.color }} />}
                </span>
              ) : null;
            })}
          </div>

          <table className="w-full text-sm">
            <tbody>
              {LABELS.map((label, l) => {
                const active = owner && (l === 0 ? lvl === 0 : lvl === l);
                return (
                  <tr key={l} className={active ? "bg-emerald-500/20 font-semibold" : ""}>
                    <td className="px-2 py-1 text-slate-300">
                      {label}{l === 0 && " (full set ×2)"}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">
                      ${Math.round(baseRent(index, l, l === 0 && mono) * mult)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {mult > 1 && <p className="text-xs text-rose-300">Includes rent inflation ×{mult.toFixed(2)}</p>}
          {g.settings.buildings && <p className="text-xs text-slate-400">Each house or hotel here costs ${houseCost(index)}. Build only when you own the whole color set.</p>}

          <div className="rounded-lg bg-white/5 px-3 py-2 text-sm">
            {owner ? (
              <>Owned by <b style={{ color: owner.color }}>{owner.name}</b>{mine && " (you)"}{lvl > 0 && ` · ${lvl === MAX_BUILD_LEVEL ? "hotel" : `${lvl} house${lvl > 1 ? "s" : ""}`}`}</>
            ) : (
              "Unowned. Land here to buy it."
            )}
          </div>

          {mine && g.settings.buildings && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  disabled={!myTurn || !!bErr}
                  onClick={onBuild}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  🏠 Build ${houseCost(index)}
                </button>
                <button
                  disabled={!myTurn || !!sErr}
                  onClick={onSell}
                  className="rounded-lg bg-slate-700 px-3 py-2 font-semibold hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sell +${Math.floor(houseCost(index) / 2)}
                </button>
              </div>
              <p className="text-xs text-amber-300">{!myTurn ? "You can build on your own turn." : bErr}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
