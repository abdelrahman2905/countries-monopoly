import { SETTING_OPTIONS, type Settings } from "../../shared/game";

type Props = { settings: Settings; editable: boolean; onChange: (patch: Partial<Settings>) => void };

const toggles: { key: "buildings" | "inflation" | "doublesRoll" | "freeParkingPot"; label: string; hint: string }[] = [
  { key: "buildings", label: "Houses & hotels", hint: "Build on a full color set to raise the rent" },
  { key: "inflation", label: "Rent inflation", hint: "Rents rise over time so games always end" },
  { key: "doublesRoll", label: "Roll again on doubles", hint: "Doubles give you an extra turn" },
  { key: "freeParkingPot", label: "Free Parking jackpot", hint: "Fines go to the pot; land on Free Parking to win it" },
];

const money = (n: number) => `$${n.toLocaleString()}`;

export default function SettingsPanel({ settings, editable, onChange }: Props) {
  const select = (key: "startMoney" | "goSalary" | "maxPlayers", label: string, fmt: (n: number) => string) => (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-300">{label}</span>
      <select
        disabled={!editable}
        value={settings[key]}
        onChange={(e) => onChange({ [key]: Number(e.target.value) })}
        className="rounded-md border border-white/15 bg-slate-800 px-2 py-1 text-sm text-white disabled:opacity-60"
      >
        {SETTING_OPTIONS[key].map((v) => <option key={v} value={v}>{fmt(v)}</option>)}
      </select>
    </label>
  );

  return (
    <div className="space-y-3">
      {select("startMoney", "Starting money", money)}
      {select("goSalary", "Go salary", money)}
      {select("maxPlayers", "Max players", (n) => `${n} players`)}
      <div className="space-y-2 border-t border-white/10 pt-3">
        {toggles.map((t) => (
          <label key={t.key} className={`flex items-start gap-3 ${editable ? "cursor-pointer" : "opacity-70"}`}>
            <input
              type="checkbox"
              disabled={!editable}
              checked={settings[t.key]}
              onChange={(e) => onChange({ [t.key]: e.target.checked })}
              className="mt-1 h-4 w-4 accent-indigo-500"
            />
            <span>
              <span className="block text-sm font-medium text-white">{t.label}</span>
              <span className="block text-xs text-slate-400">{t.hint}</span>
            </span>
          </label>
        ))}
      </div>
      {!editable && <p className="text-xs text-slate-400">Only the host can change these.</p>}
    </div>
  );
}
