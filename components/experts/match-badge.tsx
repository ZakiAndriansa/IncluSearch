import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface MatchBadgeProps {
  score: number;
  compact?: boolean;
  showReasons?: boolean;
  reasons?: string[];
}

export function MatchBadge({ score, compact = false, showReasons = false, reasons }: MatchBadgeProps) {
  const tier =
    score >= 80 ? "high" : score >= 60 ? "medium" : "low";

  const tierStyles = {
    high: "bg-gradient-to-r from-olive-500 to-teal-dark text-white border-transparent",
    medium: "bg-gradient-to-r from-teal-dark to-teal-light text-white border-transparent",
    low: "bg-sand-200 text-sand-700 border-sand-300",
  };

  const label = score >= 80 ? "Sangat Cocok" : score >= 60 ? "Cocok" : "Kurang Cocok";

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border",
          tierStyles[tier]
        )}
        title={`Kecocokan: ${score}%`}
      >
        <Sparkles className="w-2.5 h-2.5" />
        {score}%
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border",
          tierStyles[tier]
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {score}% Cocok — {label}
      </div>

      {showReasons && reasons && reasons.length > 0 && (
        <ul className="space-y-1">
          {reasons.map((reason, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-sand-600">
              <span className="w-1.5 h-1.5 rounded-full bg-olive-400 flex-shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
