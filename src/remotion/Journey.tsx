import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type JourneyStage = { lv: string; label: string; total: number; done: number };
export type JourneyProps = { stages: JourneyStage[]; done: number; total: number };

export const JOURNEY = { width: 1200, height: 400, fps: 30, durationInFrames: 130 };

// graphite on sand, same tones as the app
const PAPER = "#e9e5df";
const LAND = "#dfd9d1";
const INK = "#1c1d1f";
const SAND = "#d9d3cb";
const ROUTE = "#a39d94";
const DIM = "#6b6863";
const FONT = "var(--font-body), system-ui, sans-serif";

type Pt = { x: number; y: number };

/** Smooth curve through the cities (Catmull-Rom), sampled so we can walk along it. */
function sampleRoute(points: Pt[], perSegment = 40) {
  const out: (Pt & { t: number })[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), t: i + t });
    }
  }
  out.push({ ...points[points.length - 1], t: points.length - 1 });
  return out;
}

const polyline = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

/** The reading path as a travel map: one city per stage, a paper plane flying the stretch you've read. */
export function Journey({ stages }: JourneyProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = JOURNEY.width;

  // cities: one per stage, plus the final destination
  const n = stages.length + 1;
  const cities: Pt[] = Array.from({ length: n }, (_, i) => ({
    x: 70 + i * ((W - 140) / (n - 1)),
    y: 205 + Math.sin(i * 1.25 + 0.4) * 78,
  }));
  const route = sampleRoute(cities);

  // where you are: first unfinished stage + how far into it
  const here = stages.findIndex((s) => s.done < s.total);
  const position = here === -1 ? n - 1 : here + (stages[here].total ? stages[here].done / stages[here].total : 0);

  const fade = (start: number, len = 14) => interpolate(frame, [start, start + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const draw = interpolate(frame, [4, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const fly = interpolate(frame, [42, 95], [0, position], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  const shown = route.filter((p) => p.t <= draw * (n - 1));
  const traveled = route.filter((p) => p.t <= fly);
  const tip = traveled[traveled.length - 1] ?? route[0];
  const prev = traveled[Math.max(0, traveled.length - 4)] ?? route[0];
  const ahead = route[Math.min(route.length - 1, route.indexOf(tip) + 3)];
  // at the very start there is no trail yet, so aim along the route ahead
  const angle = tip === prev ? (Math.atan2(ahead.y - tip.y, ahead.x - tip.x) * 180) / Math.PI : (Math.atan2(tip.y - prev.y, tip.x - prev.x) * 180) / Math.PI;
  const arrived = spring({ frame: frame - 96, fps, config: { damping: 12 } });
  const bob = Math.sin((frame - 96) / 7) * 3 * arrived;

  return (
    <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: FONT, overflow: "hidden" }}>
      <svg width={W} height={JOURNEY.height} style={{ position: "absolute", inset: 0 }}>
        {/* map paper: graticule, land masses, waves, compass */}
        <g opacity={fade(0, 18)}>
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`v${i}`} x1={i * 100} x2={i * 100} y1={0} y2={400} stroke={SAND} strokeWidth={1} strokeDasharray="2 6" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1={0} x2={W} y1={i * 100} y2={i * 100} stroke={SAND} strokeWidth={1} strokeDasharray="2 6" />
          ))}
          <path d="M -20 60 C 80 20, 180 70, 240 140 S 300 300, 180 340 S -20 330, -20 260 Z" fill={LAND} />
          <path d="M 330 -20 C 420 40, 560 30, 610 90 S 560 220, 470 200 S 330 120, 300 60 Z" fill={LAND} />
          <path d="M 520 300 C 600 250, 720 270, 780 330 S 760 430, 640 430 S 480 360, 520 300 Z" fill={LAND} />
          <path d="M 760 40 C 860 0, 1000 30, 1040 110 S 980 230, 880 210 S 730 120, 760 40 Z" fill={LAND} />
          <path d="M 1040 260 C 1110 220, 1230 240, 1230 320 S 1150 420, 1070 400 S 990 300, 1040 260 Z" fill={LAND} />
          {[
            [290, 300],
            [690, 150],
            [960, 330],
            [120, 380],
          ].map(([x, y], i) => (
            <path key={i} d={`M ${x} ${y} q 6 -6 12 0 t 12 0 M ${x + 6} ${y + 9} q 6 -6 12 0 t 12 0`} stroke={ROUTE} strokeWidth={1.5} fill="none" />
          ))}
          <g transform="translate(60 62)">
            <circle r={24} fill="none" stroke={ROUTE} strokeWidth={1.5} />
            <path d="M 0 -30 L 6 0 L 0 30 L -6 0 Z" fill={INK} />
            <path d="M -30 0 L 0 -5 L 30 0 L 0 5 Z" fill={ROUTE} />
            <text y={-36} textAnchor="middle" fontSize={12} fill={INK} fontWeight={700}>
              N
            </text>
          </g>
        </g>

        {/* the whole route, dashed */}
        <path d={polyline(shown)} fill="none" stroke={ROUTE} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        {/* the stretch already read, in ink */}
        {traveled.length > 1 && <path d={polyline(traveled)} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}

        {/* cities */}
        {cities.map((c, i) => {
          const last = i === n - 1;
          const s = stages[i];
          const complete = last ? here === -1 : s.done === s.total;
          const current = i === here;
          const pop = spring({ frame: frame - 10 - i * 4, fps, config: { damping: 13, mass: 0.6 } });
          // labels go on the open side of the curve: above at peaks, below in valleys
          const nb = [cities[i - 1], cities[i + 1]].filter(Boolean);
          const below = c.y > nb.reduce((a, b) => a + b.y, 0) / nb.length;
          return (
            <g key={i} transform={`translate(${c.x} ${c.y}) scale(${pop})`}>
              {current && <circle r={22 + Math.sin(frame / 6) * 2} fill="none" stroke={INK} strokeWidth={1.5} opacity={0.35} />}
              {last ? (
                <g>
                  <line x1={0} y1={8} x2={0} y2={-30} stroke={INK} strokeWidth={3} strokeLinecap="round" />
                  <path d="M 0 -30 L 24 -22 L 0 -14 Z" fill={complete ? INK : SAND} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
                  <circle r={6} fill={INK} />
                </g>
              ) : (
                <>
                  <circle r={14} fill={complete ? INK : current ? SAND : PAPER} stroke={INK} strokeWidth={3} />
                  {complete && <path d="M -6 0 L -2 5 L 7 -5" stroke={PAPER} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                </>
              )}
              <g transform={`translate(0 ${below ? 40 : last ? -58 : -42})`} opacity={fade(18 + i * 4)}>
                <text textAnchor="middle" fontSize={18} fontWeight={700} fill={INK}>
                  {last ? "Fluência" : s.lv}
                </text>
                <text y={18} textAnchor="middle" fontSize={13} fill={DIM}>
                  {last ? "destino" : `${s.label} · ${s.done}/${s.total}`}
                </text>
              </g>
            </g>
          );
        })}

        {/* paper plane flying the stretch you've read */}
        <g transform={`translate(${tip.x} ${tip.y + bob}) rotate(${angle})`} opacity={fade(40, 6)}>
          <path d="M 16 0 L -12 -11 L -6 0 L -12 11 Z" fill={INK} stroke={PAPER} strokeWidth={2} strokeLinejoin="round" />
          <path d="M 16 0 L -6 0" stroke={PAPER} strokeWidth={1.5} />
        </g>

        {/* "you are here" */}
        {(() => {
          // the marker goes opposite the nearest city's label
          const near = Math.min(n - 1, Math.round(position));
          const nn = [cities[near - 1], cities[near + 1]].filter(Boolean);
          const above = cities[near].y > nn.reduce((a, b) => a + b.y, 0) / nn.length;
          const left = Math.max(8, Math.min(W - 178, tip.x - 85));
          const top = above ? tip.y - 66 : tip.y + 34;
          const arrow = above
            ? `M ${tip.x - 7} ${top + 32} L ${tip.x + 7} ${top + 32} L ${tip.x} ${top + 41} Z`
            : `M ${tip.x - 7} ${top} L ${tip.x + 7} ${top} L ${tip.x} ${top - 9} Z`;
          return (
            <g opacity={arrived} transform={`translate(0 ${(1 - arrived) * (above ? -16 : 16) + bob})`}>
              <rect x={left} y={top} width={170} height={32} rx={16} fill={INK} />
              <text x={left + 85} y={top + 21} textAnchor="middle" fontSize={13} fontWeight={700} letterSpacing={1.5} fill={PAPER}>
                VOCÊ ESTÁ AQUI
              </text>
              <path d={arrow} fill={INK} />
            </g>
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
}
