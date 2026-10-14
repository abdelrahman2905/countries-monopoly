import { useEffect, useRef, useState } from "react";
import { BOARD, type GameState } from "../../shared/game";

export const ROLL_MS = 900; // how long the dice tumble
const STEP_MS = 150; // time per square while a piece walks
const MAX_WALK = 14; // longer jumps (jail, "go back", "advance to Go") teleport instead of walking

/**
 * The server sends final positions at once. This hook turns that into what players see:
 * the dice tumble for a moment, then each piece hops square by square to its destination.
 * `busy` is true while that is happening (the UI holds back the next action until it ends).
 */
export function useBoardAnimation(g: GameState) {
  const [shown, setShown] = useState<Record<string, number>>(() => Object.fromEntries(g.players.map((p) => [p.id, p.pos])));
  const [rolling, setRolling] = useState(false);
  const [moving, setMoving] = useState(false);

  const shownRef = useRef(shown);
  const targets = useRef<Record<string, number>>(Object.fromEntries(g.players.map((p) => [p.id, p.pos])));
  const walking = useRef(new Set<string>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const lastRoll = useRef(g.rollCount);
  const rollEnds = useRef(0);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms);
    timers.current.add(t);
  };
  const setPos = (id: string, pos: number) => {
    shownRef.current = { ...shownRef.current, [id]: pos };
    setShown(shownRef.current);
  };

  // dice: tumble on every new roll
  useEffect(() => {
    if (g.rollCount === lastRoll.current) return;
    lastRoll.current = g.rollCount;
    rollEnds.current = Date.now() + ROLL_MS;
    setRolling(true);
    later(() => setRolling(false), ROLL_MS);
  }, [g.rollCount]);

  // pieces: walk toward the server's position
  useEffect(() => {
    const n = BOARD.length;
    const step = (id: string) => {
      const cur = shownRef.current[id] ?? 0;
      const to = targets.current[id];
      if (to === undefined || cur === to) {
        walking.current.delete(id);
        if (walking.current.size === 0) setMoving(false);
        return;
      }
      const dist = (to - cur + n) % n;
      setPos(id, dist > MAX_WALK ? to : (cur + 1) % n);
      later(() => step(id), STEP_MS);
    };

    for (const p of g.players) {
      targets.current[p.id] = p.pos;
      if (shownRef.current[p.id] === undefined) setPos(p.id, p.pos);
      if (shownRef.current[p.id] !== p.pos && !walking.current.has(p.id)) {
        walking.current.add(p.id);
        setMoving(true);
        later(() => step(p.id), Math.max(0, rollEnds.current - Date.now())); // wait for the dice first
      }
    }
  }, [g.players]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return { shown, rolling, busy: rolling || moving };
}
