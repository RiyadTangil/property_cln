import React from "react";

export function SalesCollectionChart() {
  const labels = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const sales = [44.9, 47.2, 39.8, 45.6, 51.3, 48.7];
  const collections = [35.8, 38.6, 31.2, 36.4, 41.7, 38.9];
  const maxVal = 60;

  return (
    <svg viewBox="0 0 260 150" className="w-100 h-100" role="img" aria-label="Sales vs Collection">
      {[0, 20, 40, 60].map((v) => {
        const y = 122 - (v / maxVal) * 105;
        return (
          <g key={v}>
            <line x1="26" y1={y} x2="252" y2={y} stroke="var(--erp-line)" strokeDasharray="3 3" />
            <text x="20" y={y + 3} fontSize="9" fill="var(--erp-muted)" textAnchor="end">
              {v}
            </text>
          </g>
        );
      })}
      {labels.map((lbl, idx) => {
        const x = 36 + idx * 36;
        const h1 = (sales[idx] / maxVal) * 105;
        const h2 = (collections[idx] / maxVal) * 105;
        return (
          <g key={lbl}>
            <rect x={x} y={122 - h1} width="11" height={h1} rx="3" fill="#6c63ff" />
            <rect x={x + 13} y={122 - h2} width="11" height={h2} rx="3" fill="#00a87e" />
            <text x={x + 12} y="138" fontSize="9.5" fill="var(--erp-muted)" textAnchor="middle">
              {lbl}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

export function SvgPieChart({
  slices,
  innerRadius = 0,
}: {
  slices: PieSlice[];
  innerRadius?: number;
}) {
  const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;
  const cx = 75;
  const cy = 75;
  const r = 64;
  let angle = -Math.PI / 2;

  const paths = slices.map((slice) => {
    const portion = (slice.value / total) * Math.PI * 2;
    const end = angle + portion;
    const largeArc = portion > Math.PI ? 1 : 0;

    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);

    let d = "";
    if (innerRadius > 0) {
      const ix1 = cx + innerRadius * Math.cos(end);
      const iy1 = cy + innerRadius * Math.sin(end);
      const ix2 = cx + innerRadius * Math.cos(angle);
      const iy2 = cy + innerRadius * Math.sin(angle);
      d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    angle = end;
    return { ...slice, d };
  });

  return (
    <svg viewBox="0 0 150 150" className="w-100 h-100" style={{ maxHeight: 150 }}>
      {paths.map((p) => (
        <path
          key={p.label}
          d={p.d}
          fill={p.color}
          stroke="var(--erp-surface, #fff)"
          strokeWidth="1.5"
        >
          <title>
            {p.label}: {p.value}
          </title>
        </path>
      ))}
    </svg>
  );
}

export function AgeingBarChart() {
  const items = [
    { label: "0–30d", value: 38.6, color: "#f0a04b" },
    { label: "31–60d", value: 22.4, color: "#e07b1e" },
    { label: "61–90d", value: 13.7, color: "#c25f10" },
    { label: "90+d", value: 21.7, color: "#8f4208" },
  ];
  const maxVal = 45;

  return (
    <svg viewBox="0 0 240 140" className="w-100 h-100" role="img" aria-label="Receivables Ageing">
      {[0, 15, 30, 45].map((v) => {
        const y = 112 - (v / maxVal) * 95;
        return (
          <line
            key={v}
            x1="20"
            y1={y}
            x2="230"
            y2={y}
            stroke="var(--erp-line)"
            strokeDasharray="3 3"
          />
        );
      })}
      {items.map((item, idx) => {
        const x = 32 + idx * 50;
        const h = (item.value / maxVal) * 95;
        return (
          <g key={item.label}>
            <rect x={x} y={112 - h} width="28" height={h} rx="5" fill={item.color} />
            <text
              x={x + 14}
              y={107 - h}
              fontSize="9"
              fontWeight="600"
              fill="var(--erp-ink)"
              textAnchor="middle"
            >
              {item.value}
            </text>
            <text x={x + 14} y="129" fontSize="9.5" fill="var(--erp-muted)" textAnchor="middle">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HorizontalBarsChart({
  rows,
  max,
  color = "#03a9f3",
}: {
  rows: { label: string; value: number; display: string }[];
  max: number;
  color?: string;
}) {
  return (
    <div className="d-flex flex-column gap-2 pt-1">
      {rows.map((r) => {
        const pct = Math.min(100, Math.round((r.value / max) * 100));
        return (
          <div key={r.label}>
            <div className="d-flex justify-content-between" style={{ fontSize: 12 }}>
              <span style={{ color: "var(--erp-ink)" }}>{r.label}</span>
              <strong style={{ color: "var(--erp-ink)" }}>{r.display}</strong>
            </div>
            <div className="progress mt-1" style={{ height: 7 }}>
              <div
                className="progress-bar"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
