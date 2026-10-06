import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

export type CelebrationProps = { title: string; level: string; done: number; total: number };

const FONT = "var(--font-body), system-ui, sans-serif";

export const CELEBRATION = { width: 800, height: 450, fps: 30, durationInFrames: 105 };

const PARTICLES = Array.from({ length: 46 }, (_, i) => {
  const a = (i / 46) * Math.PI * 2 + (i % 3) * 0.21;
  return { a, dist: 170 + ((i * 37) % 160), size: 5 + ((i * 13) % 9), tone: ["#1c1d1f", "#45474b", "#6b6863", "#bdb6ac"][i % 4], delay: (i * 7) % 10 };
});

export function Celebration({ title, level, done, total }: CelebrationProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 11, mass: 0.7 } });
  const titleIn = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const bar = interpolate(frame, [40, 80], [total ? (done - 1) / total : 0, total ? done / total : 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const shown = Math.round(interpolate(frame, [40, 80], [done - 1, done], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill
      style={{
        background: "#e9e5df",
        color: "#1c1d1f",
        fontFamily: "var(--font-body), system-ui, sans-serif",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {PARTICLES.map((p, i) => {
        const t = interpolate(frame - p.delay, [0, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const fall = interpolate(frame - p.delay, [20, 100], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const x = Math.cos(p.a) * p.dist * t;
        const y = Math.sin(p.a) * p.dist * t * 0.75 + fall;
        const o = interpolate(frame - p.delay, [0, 6, 70, 95], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 400 + x,
              top: 150 + y,
              width: p.size,
              height: p.size * (i % 2 ? 1 : 2.2),
              borderRadius: i % 2 ? "50%" : 2,
              background: p.tone,
              opacity: o,
              transform: `rotate(${frame * (i % 2 ? 6 : -4)}deg)`,
            }}
          />
        );
      })}

      <div style={{ textAlign: "center", display: "grid", gap: 14, justifyItems: "center", width: 640 }}>
        <div
          style={{
            transform: `scale(${pop})`,
            width: 96,
            height: 96,
            borderRadius: 48,
            background: "#1c1d1f",
            color: "#e9e5df",
            display: "grid",
            placeItems: "center",
            fontSize: 46,
            fontWeight: 300,
          }}
        >
          ✓
        </div>
        <div style={{ fontFamily: FONT, fontSize: 14, letterSpacing: "0.22em", textTransform: "uppercase", opacity: titleIn, color: "#777777" }}>Livro concluído</div>
        <div
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: title.length > 30 ? 38 : 50,
            fontWeight: 300,
            lineHeight: 1.1,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 24}px)`,
          }}
        >
          {title}
        </div>
        <div style={{ fontFamily: FONT, opacity: titleIn, fontSize: 15, color: "#333333" }}>{level}</div>
        <div style={{ width: 420, marginTop: 10, opacity: interpolate(frame, [32, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ height: 14, borderRadius: 7, border: "1.5px solid #1c1d1f", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${bar * 100}%`, background: "#1c1d1f" }} />
          </div>
          <div style={{ marginTop: 10, fontFamily: FONT, fontSize: 14, color: "#777777", fontVariantNumeric: "tabular-nums" }}>
            {shown} de {total} livros lidos
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
