export default function ScoreRing({ score = 0, size = 150, strokeWidth = 9, tone }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (safeScore / 100) * circumference;
  const TONES = { signal: "hsl(var(--signal))", warn: "hsl(var(--warn))", danger: "hsl(var(--danger))" };
  const stroke = TONES[tone] || (safeScore >= 80 ? TONES.signal : safeScore >= 55 ? TONES.warn : TONES.danger);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 900ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-semibold tracking-tight text-foreground">{safeScore}</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}