import { useEffect, useState } from "react";
import { PLAYER_COLORS, TEAMS, type Player } from "../../shared/game";

type Props = {
  me: Player;
  taken: Set<string>;
  teams: number; // number of teams to choose from (0 = no teams in this room)
  onChange: (patch: { name?: string; color?: string; team?: number }) => void;
};

/** Lets each player choose their own name, piece color and (in team mode) team in the lobby. */
export default function ProfilePicker({ me, taken, teams, onChange }: Props) {
  const [name, setName] = useState(me.name);
  useEffect(() => setName(me.name), [me.name]);

  const commit = () => {
    const n = name.trim();
    if (n && n !== me.name) onChange({ name: n });
    else setName(me.name);
  };

  return (
    <div className="space-y-3 rounded-xl bg-white/5 p-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Your name</span>
        <input
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white outline-none focus:border-indigo-400"
        />
      </label>
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Your color</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLAYER_COLORS.map((c) => {
            const mine = c === me.color;
            const used = !mine && taken.has(c);
            return (
              <button
                key={c}
                disabled={used}
                onClick={() => onChange({ color: c })}
                aria-label={`Color ${c}${used ? " (taken)" : ""}`}
                aria-pressed={mine}
                className={`h-8 w-8 rounded-full transition ${mine ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""} ${
                  used ? "cursor-not-allowed opacity-25" : "hover:scale-110"
                }`}
                style={{ background: c }}
              >
                {mine && <span className="text-sm font-bold text-white drop-shadow">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      {teams > 0 && (
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Your team</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEAMS.slice(0, teams).map((t, i) => (
              <button
                key={t.name}
                onClick={() => onChange({ team: i })}
                aria-pressed={me.team === i}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition ${
                  me.team === i ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "opacity-60 hover:opacity-100"
                }`}
                style={{ background: t.color }}
              >
                {t.icon} {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
