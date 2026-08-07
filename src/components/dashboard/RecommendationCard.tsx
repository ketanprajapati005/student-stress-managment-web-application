import { cn } from "@/lib/utils";
import { Sparkles, Wind, Heart, Lightbulb } from "lucide-react";

interface RecommendationCardProps {
  recommendation: {
    summary: string;
    recommendations: string[];
    breathing_exercise: string;
    lifestyle_tip: string;
  } | null;
  isLoading?: boolean;
}

export function RecommendationCard({
  recommendation,
  isLoading,
}: RecommendationCardProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-semibold">AI Generating Insights...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 shimmer rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Insights</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Complete an assessment to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-semibold">AI Insights</span>
      </div>

      <p className="text-sm text-muted-foreground">{recommendation.summary}</p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Recommendations</span>
          </div>
          <ul className="space-y-2">
            {recommendation.recommendations.map((rec, index) => (
              <li
                key={index}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary mt-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Breathing Exercise</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {recommendation.breathing_exercise}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Lifestyle Tip</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {recommendation.lifestyle_tip}
          </p>
        </div>
      </div>
    </div>
  );
}
