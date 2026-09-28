export function ProgressBar({ pct, colorClass = "bg-accent" }: { pct: number; colorClass?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
