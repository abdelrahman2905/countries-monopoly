import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";
import type { Action, GameState } from "../../shared/game";

// Set VITE_PARTYKIT_HOST in .env (local) or in Vercel's env vars (production).
export const PARTYKIT_HOST: string = import.meta.env.VITE_PARTYKIT_HOST || "127.0.0.1:1999";

/** Secret per-browser token so the server can recognise us after a reconnect. */
function getToken(): string {
  try {
    let t = localStorage.getItem("cm-token");
    if (!t) {
      t = crypto.randomUUID();
      localStorage.setItem("cm-token", t);
    }
    return t;
  } catch {
    return crypto.randomUUID();
  }
}

export function useGame(code: string, name: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<PartySocket | null>(null);

  useEffect(() => {
    const socket = new PartySocket({ host: PARTYKIT_HOST, room: code });
    ws.current = socket;
    const token = getToken();
    socket.addEventListener("open", () => {
      setConnected(true);
      socket.send(JSON.stringify({ type: "JOIN", name, token }));
    });
    socket.addEventListener("close", () => setConnected(false));
    let clear: ReturnType<typeof setTimeout> | undefined;
    const flash = (text: string) => {
      setError(text);
      clearTimeout(clear);
      clear = setTimeout(() => setError(null), 3500);
    };
    socket.addEventListener("message", (e) => {
      let msg: { type: string; state?: GameState; id?: string; message?: string };
      try { msg = JSON.parse(e.data as string); } catch { return; }
      if (msg.type === "STATE" && msg.state) setState(msg.state);
      else if (msg.type === "YOU" && msg.id) setMyId(msg.id);
      else if ((msg.type === "ERROR" || msg.type === "NOTICE") && msg.message) flash(msg.message);
    });
    return () => { clearTimeout(clear); socket.close(); };
  }, [code, name]);

  // Clients only send intents; the server decides what actually happens.
  const send = useCallback((action: Exclude<Action, { type: "JOIN" }>) => {
    ws.current?.send(JSON.stringify({ type: "ACTION", action }));
  }, []);

  return { state, myId, connected, error, send };
}
