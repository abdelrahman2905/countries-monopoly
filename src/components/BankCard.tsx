import { LOAN_OPTIONS, LOAN_ROUNDS, type GameState, type Player } from "../../shared/game";
import type { useGame } from "../lib/useGame";

type Send = ReturnType<typeof useGame>["send"];

/** Borrow from the bank (when the host enabled loans) and repay within LOAN_ROUNDS rounds. */
export default function BankCard({ g, me, canAct, send }: { g: GameState; me: Player; canAct: boolean; send: Send }) {
  const loan = g.loans[me.id];
  const left = loan ? loan.due - g.round : 0;
  return (
    <section className="rounded-2xl bg-slate-900/80 p-4 text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
      <h3 className="mb-2 font-bold">🏦 Bank</h3>
      {loan ? (
        <div className="space-y-2 text-sm">
          <div>
            You owe <b className="text-red-300">${loan.debt}</b>.{" "}
            <span className={left <= 1 ? "text-red-300" : "text-slate-300"}>
              {left > 0 ? `Due in ${left} round${left > 1 ? "s" : ""}.` : "Due now!"}
            </span>
          </div>
          <button
            disabled={!canAct || me.money < loan.debt}
            onClick={() => send({ type: "REPAY" })}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 font-semibold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Repay ${loan.debt}
          </button>
          <p className="text-xs text-slate-400">If you don't repay in time, the bank takes the cash, or you must sell a country.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Borrow now, repay within {LOAN_ROUNDS} rounds (+{g.settings.loanInterest}% interest). Only on your turn.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LOAN_OPTIONS.map((amount) => (
              <button
                key={amount}
                disabled={!canAct || me.bankrupt}
                onClick={() => send({ type: "TAKE_LOAN", amount })}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Borrow ${amount}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
