/** Dependency-free SVG charts, server-renderable, themed via currentColor/tokens */

export function BarChart({
  data,
  height = 180,
  color = "var(--color-accent)",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height / 3}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height / 3 - 14);
        return (
          <g key={d.label}>
            <rect
              x={i * bw + bw * 0.18}
              y={height / 3 - 12 - h}
              width={bw * 0.64}
              height={h}
              rx={1.2}
              fill={color}
              opacity={0.85}
            />
            <text
              x={i * bw + bw / 2}
              y={height / 3 - 3}
              textAnchor="middle"
              fontSize={3.2}
              fill="var(--color-ink-faint)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  segments,
  size = 160,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const r = 15.9;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" style={{ width: size, height: size }}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        {segments.map((s) => {
          const frac = s.value / total;
          const el = (
            <circle
              key={s.label}
              cx="21"
              cy="21"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="6"
              strokeDasharray={`${frac * 100} ${100 - frac * 100}`}
              strokeDashoffset={-acc * 100 + 25}
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <ul className="space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12px] text-ink-dim">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="font-mono text-ink-faint">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBarList({ data, unit = "" }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[12px] text-ink-dim">{d.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-[12px] text-ink-faint">
            {d.value.toLocaleString()}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
