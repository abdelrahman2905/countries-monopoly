import { useState } from "react";
import Home from "./components/Home";
import Room from "./components/Room";
import Footer from "./components/Footer";

const initialRoom = () => new URLSearchParams(location.search).get("room")?.toLowerCase() || "";
const initialName = () => {
  try { return localStorage.getItem("cm-name") || ""; } catch { return ""; }
};

export default function App() {
  const [name, setNameState] = useState(initialName);
  const [code, setCode] = useState(initialRoom);
  // A shared link (?room=xxxxx) still asks for a name before joining.
  const [entered, setEntered] = useState(false);

  const setName = (n: string) => {
    setNameState(n);
    try { localStorage.setItem("cm-name", n); } catch { /* ignore */ }
  };
  const enter = (c: string) => {
    history.replaceState(null, "", `?room=${c}`);
    setCode(c);
    setEntered(true);
  };
  const leave = () => {
    history.replaceState(null, "", location.pathname);
    setCode("");
    setEntered(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {entered && code ? (
          <Room code={code} name={name.trim()} onLeave={leave} />
        ) : (
          <Home name={name} setName={setName} onEnter={enter} initialCode={code} />
        )}
      </main>
      <Footer />
    </div>
  );
}
