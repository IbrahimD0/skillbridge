"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ScoreRing({ score, size = 120, label = "Overall Score" }: ScoreRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const color = score >= 70 ? "#14b8a6" : score >= 40 ? "#f59e0b" : "#f43f5e";
  const bgColor = score >= 70 ? "#f0fdfa" : score >= 40 ? "#fffbeb" : "#fff1f2";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill={bgColor}
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] font-medium text-slate-400">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}
