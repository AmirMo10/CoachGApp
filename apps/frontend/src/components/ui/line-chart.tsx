'use client';

export interface ChartPoint {
  label: string;
  value: number;
}

/**
 * Minimal, dependency-free SVG line chart with an area fill, grid, and dots.
 * Renders responsively via a viewBox; good for small progress trends.
 */
export function LineChart({
  data,
  height = 180,
  unit = '',
  color = '#10b981',
}: {
  data: ChartPoint[];
  height?: number;
  unit?: string;
  color?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="grid h-[180px] place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
        Log at least two entries to see a trend.
      </div>
    );
  }

  const W = 600;
  const H = height;
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  // Pad the domain a little so the line isn't glued to the edges.
  const lo = min - range * 0.1;
  const hi = max + range * 0.1;

  const x = (i: number) => pad.left + (i / (data.length - 1)) * innerW;
  const y = (v: number) => pad.top + innerH - ((v - lo) / (hi - lo)) * innerH;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const area = `${line} L ${x(data.length - 1)} ${pad.top + innerH} L ${x(0)} ${pad.top + innerH} Z`;
  const ticks = [hi, (hi + lo) / 2, lo];
  const id = `grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={pad.left - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
            {Math.round(t)}
            {unit}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="white" stroke={color} strokeWidth="2" />
          {(i === 0 || i === data.length - 1 || data.length <= 8) && (
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {d.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
