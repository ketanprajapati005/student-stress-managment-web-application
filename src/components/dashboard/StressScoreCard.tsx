import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

interface StressScoreCardProps {
  score: number;
  riskLevel: "low" | "moderate" | "high";
}

export function StressScoreCard({ score, riskLevel }: StressScoreCardProps) {
  const riskConfig = {
    low: {
      label: "Low Stress",
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
      gradientClass: "from-success/20 to-success/5",
    },
    moderate: {
      label: "Moderate Stress",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
      gradientClass: "from-warning/20 to-warning/5",
    },
    high: {
      label: "High Stress",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      gradientClass: "from-destructive/20 to-destructive/5",
    },
  };

  const config = riskConfig[riskLevel];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 bg-gradient-to-br",
        config.borderColor,
        config.gradientClass
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Activity className={cn("w-full h-full", config.color)} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <Activity className={cn("h-5 w-5", config.color)} />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Current Stress Level
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={cn("text-5xl font-bold", config.color)}>
            {score}
          </span>
          <span className="text-lg text-muted-foreground">/100</span>
        </div>

        <div className="mt-4">
          <span
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
              config.bgColor,
              config.color
            )}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
