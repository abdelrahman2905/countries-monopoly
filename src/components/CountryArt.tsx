import shapes from "../data/shapes.json";

const paths = shapes as Record<string, string>;

/** Real flag image (SVG files live in /public/flags). */
export function Flag({ iso, name, className = "" }: { iso: string; name: string; className?: string }) {
  return (
    <img
      src={`/flags/${iso}.svg`}
      alt={`Flag of ${name}`}
      draggable={false}
      className={`aspect-[4/3] rounded-[3px] object-cover shadow ring-1 ring-black/20 ${className}`}
    />
  );
}

/** The country's outline in its flag color, so each tile feels like the real country. */
export function Shape({ iso, color, opacity = 1, className = "" }: { iso: string; color: string; opacity?: number; className?: string }) {
  const d = paths[iso];
  if (!d) return null;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d={d} fill={color} fillOpacity={opacity} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
}
