"use client";

interface ProgressBarProps {
  label: string;
  value: number;
}

export default function ProgressBar({ label, value }: ProgressBarProps) {
  const color = value >= 70 ? "bg-teal-500" : value >= 40 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={`font-bold tabular-nums ${
          value >= 70 ? "text-teal-700" : value >= 40 ? "text-amber-700" : "text-rose-700"
        }`}>{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
