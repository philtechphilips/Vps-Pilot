import type { CSSProperties } from "react";

// Animated wireframe illustrations (CSS + SVG SMIL, no JS): dark fills,
// hairline strokes and a single magenta accent.

const S = "#2e2e2e";
const F = "#0f0f0f";
const B = "#c066bd";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function FleetIllustration() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="fleet-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#060606" stopOpacity="0" />
          <stop offset="1" stopColor="#060606" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map((i) => {
        const x = 54 + i * 26;
        const y = 34 + i * 30;
        const active = i === 1;
        return (
          <g key={i} className="svg-float" style={d(i * 700)}>
            <rect x={x} y={y} width="190" height="78" rx="6" fill={F} stroke={active ? B : S} />
            {[0, 1, 2].map((r) => (
              <g key={r}>
                <rect x={x + 12} y={y + 12 + r * 20} width="166" height="14" rx="3" fill="#141414" stroke={S} />
                <circle
                  cx={x + 22}
                  cy={y + 19 + r * 20}
                  r="2.5"
                  className={active && r === 0 ? "svg-blink" : undefined}
                  fill={active && r === 0 ? "#0cce6b" : r === 2 && i === 0 ? "#f5a623" : "#3a3a3a"}
                />
                <rect x={x + 32} y={y + 17 + r * 20} width={40 + ((r + i) % 3) * 18} height="4" rx="2" fill="#2a2a2a" />
                <rect x={x + 130} y={y + 17 + r * 20} width="38" height="4" rx="2" fill="#1f1f1f" />
                <rect
                  x={x + 130}
                  y={y + 17 + r * 20}
                  width={14 + ((r * 7 + i * 5) % 24)}
                  height="4"
                  rx="2"
                  fill={active ? B : "#4a4a4a"}
                  className="svg-bar"
                  style={d(r * 400 + i * 250)}
                />
              </g>
            ))}
          </g>
        );
      })}
      <g className="svg-float" style={d(350)}>
        <rect x="214" y="68" width="66" height="14" rx="7" fill="#060606" stroke={B} />
        <circle cx="222" cy="75" r="2" fill="#0cce6b" className="svg-blink" />
        <text x="228" y="77.5" fontFamily="var(--font-geist-mono)" fontSize="7" fill={B}>
          heartbeat 3s
        </text>
      </g>
      <rect x="0" y="120" width="320" height="80" fill="url(#fleet-fade)" />
    </svg>
  );
}

export function PipelineIllustration() {
  const steps = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden="true">
      <rect x="40" y="26" width="240" height="160" rx="8" fill={F} stroke={S} />
      <path d="M40 46h240" stroke={S} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={54 + i * 10} cy="36" r="2.5" fill="#333" />
      ))}

      {/* Step list lights up in sequence, then loops. */}
      <rect x="54" y="58" width="58" height="114" rx="4" fill="#121212" stroke={S} />
      {steps.map((i) => (
        <g key={i}>
          <circle cx="64" cy={72 + i * 20} r="3" fill="#333">
            <animate
              attributeName="fill"
              values={`#333;#333;${i === 4 ? B : "#0cce6b"};${i === 4 ? B : "#0cce6b"};#333`}
              keyTimes={`0;${(i * 0.15).toFixed(2)};${(i * 0.15 + 0.05).toFixed(2)};0.92;1`}
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
          <rect x="72" y={70 + i * 20} width={28 - (i % 2) * 8} height="4" rx="2" fill="#2a2a2a" />
        </g>
      ))}

      {/* Active build panel with a sweeping progress bar. */}
      <rect x="122" y="58" width="144" height="54" rx="4" fill="#121212" stroke={B} />
      <rect x="132" y="68" width="60" height="5" rx="2.5" fill="#3a3a3a" />
      <rect x="132" y="80" width="112" height="4" rx="2" fill="#262626" />
      <rect x="132" y="90" width="92" height="4" rx="2" fill="#262626" />
      <rect x="132" y="100" width="112" height="4" rx="2" fill="#1f1f1f" />
      <rect x="132" y="100" width="0" height="4" rx="2" fill={B}>
        <animate attributeName="width" values="0;112;112;0" keyTimes="0;0.7;0.92;1" dur="5s" repeatCount="indefinite" />
      </rect>

      {/* Mini chart draws itself. */}
      <rect x="122" y="120" width="68" height="52" rx="4" fill="#121212" stroke={S} />
      <path d="M132 160l10-12 10 6 10-16 18 10" fill="none" stroke="#5a5a5a" strokeWidth="1.5" strokeDasharray="80" strokeDashoffset="80">
        <animate attributeName="stroke-dashoffset" values="80;0;0;80" keyTimes="0;0.5;0.9;1" dur="5s" repeatCount="indefinite" />
      </path>
      <rect x="198" y="120" width="68" height="52" rx="4" fill="#121212" stroke={S} />
      <path d="M208 160h48M208 150h30M208 140h40" stroke="#2a2a2a" strokeWidth="4" strokeLinecap="round" />

      {/* Promote connector with flowing dashes. */}
      <path d="M266 85h30v60" fill="none" stroke={B} className="dash-flow" />
      <circle cx="296" cy="148" r="3" fill={B} />
      <circle cx="296" cy="148" r="3" fill="none" stroke={B}>
        <animate attributeName="r" values="3;10" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function TopologyIllustration() {
  const nodes = [
    { x: 160, y: 42, main: true },
    { x: 100, y: 102 },
    { x: 220, y: 102 },
    { x: 60, y: 162 },
    { x: 140, y: 162 },
    { x: 260, y: 162 },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
  ];
  // Agents dial out: packets travel from each leaf up to the control plane.
  const routes = [
    { path: `M${nodes[4].x} ${nodes[4].y} L${nodes[1].x} ${nodes[1].y} L${nodes[0].x} ${nodes[0].y}`, dur: 2.6, begin: 0 },
    { path: `M${nodes[5].x} ${nodes[5].y} L${nodes[2].x} ${nodes[2].y} L${nodes[0].x} ${nodes[0].y}`, dur: 2.4, begin: 0.9 },
    { path: `M${nodes[1].x} ${nodes[1].y} L${nodes[0].x} ${nodes[0].y}`, dur: 1.6, begin: 1.7 },
  ];
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden="true">
      {edges.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={a === 0 ? B : S} strokeWidth="1.25" strokeOpacity={a === 0 ? 0.7 : 1} />
      ))}
      {routes.map((r, i) => (
        <circle key={i} r="2.6" fill="#f3c6f1">
          <animateMotion path={r.path} dur={`${r.dur}s`} begin={`${r.begin}s`} repeatCount="indefinite" calcMode="linear" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur={`${r.dur}s`} begin={`${r.begin}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          {n.main && (
            <circle cx={n.x} cy={n.y} r="17" fill="none" stroke={B}>
              <animate attributeName="r" values="17;30" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={n.x} cy={n.y} r={n.main ? 17 : 15} fill={n.main ? "#060606" : "#1a1a1a"} stroke={n.main ? B : S} strokeWidth={n.main ? 1.5 : 1} />
          {n.main ? (
            <circle cx={n.x} cy={n.y} r="6" fill={B} />
          ) : (
            <circle cx={n.x} cy={n.y} r="3" fill={i === 3 ? "#ff4d4f" : "#4a4a4a"} className={i === 3 ? "svg-blink" : undefined} />
          )}
        </g>
      ))}
      <g fontFamily="var(--font-geist-mono)" fontSize="7" fill="#707070">
        <text x="186" y="40">control plane</text>
        <text x="236" y="182">agent · outbound only</text>
      </g>
    </svg>
  );
}

/** Outlined hero wordmark: guide lines extend, then the letters draw themselves. */
export function HeroWordmark() {
  return (
    <svg viewBox="0 0 1000 220" className="h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-stroke" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e3a6e0" />
          <stop offset="1" stopColor="#7e3a7c" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="hero-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0.35" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="hero-mask">
          <rect x="0" y="0" width="1000" height="220" fill="url(#hero-fade)" />
        </mask>
      </defs>
      <g mask="url(#hero-mask)">
        <g stroke="#a54ca2" strokeOpacity="0.35" strokeWidth="1">
          <line x1="0" x2="1000" y1="30" y2="30" className="grow-x" style={d(0)} />
          <line x1="0" x2="1000" y1="196" y2="196" className="grow-x" style={d(150)} />
          <line x1="138" x2="138" y1="0" y2="220" className="grow-y" style={d(300)} />
          <line x1="862" x2="862" y1="0" y2="220" className="grow-y" style={d(400)} />
        </g>
        <text
          x="500"
          y="196"
          textAnchor="middle"
          fontFamily="var(--font-geist-sans)"
          fontWeight="300"
          fontSize="232"
          letterSpacing="-6"
          fill="none"
          stroke="url(#hero-stroke)"
          strokeWidth="1.6"
          className="stroke-draw"
          style={d(300)}
        >
          PILOT
        </text>
      </g>
    </svg>
  );
}
