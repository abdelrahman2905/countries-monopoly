import { useState } from "react";
import { Flag } from "./CountryArt";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const makeCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(5)), (n) => ALPHABET[n % ALPHABET.length]).join("");

type Props = { name: string; setName: (n: string) => void; onEnter: (code: string) => void; initialCode?: string };

const SHOWCASE: [string, string][] = [["jp", "Japan"], ["br", "Brazil"], ["fr", "France"], ["eg", "Egypt"], ["us", "USA"], ["in", "India"]];

export default function Home({ name, setName, onEnter, initialCode = "" }: Props) {
  const [code, setCode] = useState(initialCode);
  const [err, setErr] = useState("");

  const go = (c: string) => {
    if (!name.trim()) return setErr("Enter your name first.");
    if (!/^[a-z0-9]{3,12}$/.test(c)) return setErr("Room codes are 3-12 letters or digits.");
    onEnter(c);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center gap-2">
          {SHOWCASE.map(([iso, n]) => <Flag key={iso} iso={iso} name={n} className="w-10" />)}
        </div>
        <h1 className="bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          Countries Monopoly
        </h1>
        <p className="mt-2 text-slate-400">Buy countries, build hotels, bankrupt your friends.</p>
      </div>

      <div className="space-y-5 rounded-2xl bg-slate-900/80 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">Your name</span>
          <input
            value={name}
            maxLength={16}
            onChange={(e) => { setName(e.target.value); setErr(""); }}
            placeholder="e.g. Sara"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
          />
        </label>

        <button
          onClick={() => go(makeCode())}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 active:scale-[0.99]"
        >
          Create a new room
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
          <div className="h-px flex-1 bg-white/10" /> or join <div className="h-px flex-1 bg-white/10" />
        </div>

        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); go(code.trim().toLowerCase()); }}>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toLowerCase()); setErr(""); }}
            placeholder="Room code"
            maxLength={12}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-800 px-3 py-2 font-mono tracking-widest text-white outline-none placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
          />
          <button className="rounded-lg bg-white/10 px-5 py-2 font-semibold text-white hover:bg-white/20">Join</button>
        </form>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">2–6 players · the host picks the room settings · bots fill empty seats</p>
    </div>
  );
}
