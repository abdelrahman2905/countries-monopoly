import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cell } from "../components/Board";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3.5;
const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/**
 * Zoom and pan for the board. The board is simply drawn bigger (its width is base size x zoom), so everything
 * stays sharp, and the wrapper scrolls. Supports buttons, Ctrl+wheel / trackpad pinch, two-finger pinch on touch
 * screens, mouse drag to pan, and centering on a square.
 */
export function useBoardZoom(big: boolean, squares: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(0);
  const [vh, setVh] = useState(() => window.innerHeight);
  const [zoom, setZoomState] = useState(1);
  const zoomRef = useRef(1);
  const pending = useRef<{ px: number; py: number; fx: number; fy: number; ratio: number } | null>(null);

  // the board's natural (zoom = 1) width fits its container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.clientWidth));
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // as large as the screen allows: nearly the full height on desktops (never smaller than 640px), the full width on phones
  const fitH = Math.max(640, vh - 150);
  const baseW = big ? Math.min(1400, fitH * 1.25, Math.max(780, wrapW)) : Math.min(1100, fitH, wrapW);
  const boardW = Math.round(baseW * zoom);

  /** Zoom to `next`, keeping the point under `focal` (client coordinates) still. */
  const zoomTo = useCallback((next: number, focal?: { x: number; y: number }) => {
    const el = wrapRef.current;
    const z = clamp(next);
    if (z === zoomRef.current) return;
    if (el) {
      const r = el.getBoundingClientRect();
      const fx = focal ? focal.x - r.left : r.width / 2;
      const fy = focal ? focal.y - r.top : r.height / 2;
      pending.current = { px: el.scrollLeft + fx, py: el.scrollTop + fy, fx, fy, ratio: z / zoomRef.current };
    }
    zoomRef.current = z;
    setZoomState(z);
  }, []);

  // after the board is re-rendered at its new size, restore the scroll so the focal point stays put
  useLayoutEffect(() => {
    const el = wrapRef.current, p = pending.current;
    if (!el || !p) return;
    pending.current = null;
    el.scrollLeft = p.px * p.ratio - p.fx;
    el.scrollTop = p.py * p.ratio - p.fy;
  }, [boardW]);

  // Ctrl+wheel (also trackpad pinch) and two-finger pinch
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // plain wheel keeps scrolling the page / the zoomed map
      e.preventDefault();
      zoomTo(zoomRef.current * Math.exp(-e.deltaY * 0.01), { x: e.clientX, y: e.clientY });
    };
    let startDist = 0, startZoom = 1;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) { startDist = dist(e.touches); startZoom = zoomRef.current; }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !startDist) return;
      e.preventDefault();
      const t = e.touches;
      zoomTo(startZoom * (dist(t) / startDist), { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
    };
    const onTouchEnd = () => { startDist = 0; };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [zoomTo]);

  // mouse drag to pan (a drag must not count as a click on a country)
  const drag = useRef({ active: false, moved: false, x: 0, y: 0, left: 0, top: 0 });
  const dragProps = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      const el = wrapRef.current;
      if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
      drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const el = wrapRef.current, d = drag.current;
      if (!el || !d.active) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true;
      if (d.moved) { el.scrollLeft = d.left - dx; el.scrollTop = d.top - dy; }
    },
    onPointerUp: () => { drag.current.active = false; },
    onPointerLeave: () => { drag.current.active = false; },
    onClickCapture: (e: React.MouseEvent) => {
      if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; }
    },
  };

  /** Scroll so that board square `i` is in the middle of the view. */
  const focusSquare = useCallback((i: number) => {
    const el = wrapRef.current;
    const board = el?.firstElementChild as HTMLElement | null;
    if (!el || !board) return;
    const side = squares / 4, n = side + 1;
    const [row, col] = cell(i, side);
    const x = board.offsetLeft + ((col - 0.5) / n) * board.offsetWidth;
    const y = board.offsetTop + ((row - 0.5) / n) * board.offsetHeight;
    el.scrollTo({ left: x - el.clientWidth / 2, top: y - el.clientHeight / 2 });
  }, [squares]);

  return {
    wrapRef, zoom, boardW, dragProps, focusSquare,
    zoomIn: () => zoomTo(zoomRef.current + 0.5),
    zoomOut: () => zoomTo(zoomRef.current - 0.5),
    reset: () => zoomTo(1),
  };
}
