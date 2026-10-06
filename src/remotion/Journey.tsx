import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type JourneyStage = { lv: string; label: string; total: number; done: number };
export type JourneyProps = { stages: JourneyStage[]; done: number; total: number };

export const JOURNEY = { width: 1200, height: 400, fps: 30, durationInFrames: 120 };

// graphite on sand, same tones as the app
const PAPER = "#e9e5df";
const INK = "#1c1d1f";
const BUILDING = "#d9d3cb";
const FAR = "#dfdad3";
const DIM = "#6b6863";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/** The reading ladder as a skyline: one building per stage, filled with ink as books are read. */
export function Journey({ stages }: JourneyProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const W = JOURNEY.width;
  const ground = 320;
  const gap = 16;
  const side = 30;
  const bw = (W - side * 2 - gap * (stages.length - 1)) / stages.length;
  const here = stages.findIndex((s) => s.done < s.total);
  const fade = (start: number) => interpolate(frame, [start, start + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: MONO, overflow: "hidden" }}>
      <svg width={W} height={JOURNEY.height} style={{ position: "absolute", inset: 0 }}>
        {/* far skyline, for depth */}
        {Array.from({ length: 27 }, (_, i) => {
          const h = 40 + ((i * 37) % 100);
          const rise = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          return <rect key={i} x={i * 46} y={ground - h * rise} width={34} height={h * rise} fill={FAR} />;
        })}

        {stages.map((s, i) => {
          const x = side + i * (bw + gap);
          const full = 80 + (i / Math.max(1, stages.length - 1)) * 190;
          const rise = spring({ frame: frame - 4 - i * 3, fps, config: { damping: 16, mass: 0.6 } });
          const h = full * rise;
          const y = ground - h;
          const ink = interpolate(frame, [40 + i * 2, 80 + i * 2], [0, s.total ? s.done / s.total : 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });
          const fill = ink * full;
          const cols = 3;
          const rows = Math.floor((full - 28) / 24);
          const winW = (bw - 24) / cols - 6;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={h} fill={BUILDING} stroke={INK} strokeWidth={2} />
              {fill > 0 && <rect x={x} y={ground - fill} width={bw} height={fill} fill={INK} />}
              {Array.from({ length: rows * cols }, (_, k) => {
                const r = Math.floor(k / cols);
                const c = k % cols;
                const wy = ground - full + 16 + r * 24;
                if (wy < y + 8) return null; // still rising
                const lit = wy > ground - fill;
                return <rect key={k} x={x + 12 + c * ((bw - 24) / cols)} y={wy} width={winW} height={11} fill={lit ? PAPER : INK} opacity={(lit ? 0.9 : 0.35) * fade(18 + i * 2)} />;
              })}
              {/* rooftop details */}
              {i === stages.length - 1 && rise > 0.98 && (
                <g fill={BUILDING} stroke={INK} strokeWidth={2} opacity={fade(30)}>
                  <rect x={x + bw / 2 - 16} y={y - 34} width={32} height={24} rx={11} />
                  <line x1={x + bw / 2 - 11} y1={y - 10} x2={x + bw / 2 - 15} y2={y} />
                  <line x1={x + bw / 2 + 11} y1={y - 10} x2={x + bw / 2 + 15} y2={y} />
                </g>
              )}
              {i % 3 === 1 && <line x1={x + bw - 14} y1={y} x2={x + bw - 14} y2={y - 24 * rise} stroke={INK} strokeWidth={2} />}
              {/* labels */}
              <text x={x + bw / 2} y={ground + 30} textAnchor="middle" fontSize={17} fill={i === here ? INK : DIM} fontWeight={i === here ? 600 : 400} opacity={fade(10 + i * 2)}>
                {s.lv}
              </text>
              <text x={x + bw / 2} y={ground + 52} textAnchor="middle" fontSize={13} fill={DIM} opacity={fade(14 + i * 2)}>
                {s.label}
              </text>
            </g>
          );
        })}

        <line x1={0} x2={W * interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" })} y1={ground} y2={ground} stroke={INK} strokeWidth={3} />

        {/* "you are here" marker drops onto the current building */}
        {here >= 0 &&
          (() => {
            const x = side + here * (bw + gap) + bw / 2;
            const top = ground - (80 + (here / Math.max(1, stages.length - 1)) * 190);
            const drop = spring({ frame: frame - 82, fps, config: { damping: 12 } });
            const bob = Math.sin((frame - 82) / 7) * 3 * drop;
            const left = Math.max(6, Math.min(W - 176, x - 85));
            return (
              <g opacity={drop} transform={`translate(0 ${(1 - drop) * -30 + bob})`}>
                <rect x={left} y={top - 58} width={170} height={32} rx={16} fill={INK} />
                <text x={left + 85} y={top - 37} textAnchor="middle" fontSize={14} letterSpacing={2} fill={PAPER}>
                  VOCÊ ESTÁ AQUI
                </text>
                <path d={`M ${x - 7} ${top - 26} L ${x + 7} ${top - 26} L ${x} ${top - 17} Z`} fill={INK} />
              </g>
            );
          })()}
      </svg>
    </AbsoluteFill>
  );
}
