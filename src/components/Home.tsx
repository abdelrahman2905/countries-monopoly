import { useState } from "react";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const makeCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(5)), (n) => ALPHABET[n % ALPHABET.length]).join("");

type Props = { name: string; setName: (n: string) => void; onEnter: (code: string) => void; initialCode?: string };

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
        <div className="text-6xl">🌍</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Countries Monopoly</h1>
        <p className="mt-1 text-slate-500">Buy countries, collect rent, bankrupt your friends.</p>
      </div>

      <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Your name</span>
          <input
            value={name}
            maxLength={16}
            onChange={(e) => { setName(e.target.value); setErr(""); }}
            placeholder="e.g. Sara"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </label>

        <button
          onClick={() => go(makeCode())}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 active:scale-[0.99]"
        >
          Create a new room
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <div className="h-px flex-1 bg-slate-200" /> or join <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); go(code.trim().toLowerCase()); }}
        >
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toLowerCase()); setErr(""); }}
            placeholder="Room code"
            maxLength={12}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono tracking-widest outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700">Join</button>
        </form>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">2–6 players · add bots if you're alone</p>
    </div>
  );
}
