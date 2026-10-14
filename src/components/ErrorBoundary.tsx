import { Component, type ReactNode } from "react";

/** Last line of defence: a rendering bug shows a friendly screen instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto max-w-sm px-4 py-20 text-center text-white">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="mt-1 text-slate-400">Your game is safe on the server. Reload to jump back in.</p>
        <button onClick={() => location.reload()} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500">
          Reload
        </button>
      </div>
    );
  }
}
