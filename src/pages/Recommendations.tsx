import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Wind,
  Heart,
  Lightbulb,
  RefreshCw,
  Loader2,
  Brain,
  Anchor,
  Coffee,
  Quote,
  ListChecks,
} from "lucide-react";

interface Recommendation {
  summary: string;
  recommendations: string[];
  breathing_exercise: string;
  lifestyle_tip: string;
  grounding_exercise?: string;
  study_break_plan?: {
    duration_minutes: number;
    activities: string[];
    return_to_focus_tip: string;
  };
  positive_affirmation?: string;
  micro_actions?: string[];
}

interface Assessment {
  score: number;
  risk_level: string;
}

interface DailyLog {
  sleep_hours: number;
  study_hours: number;
  mood: number;
}

export default function Recommendations() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [latestLog, setLatestLog] = useState<DailyLog | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch latest assessment
    const { data: assessmentData } = await supabase
      .from("assessments")
      .select("score, risk_level")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch latest log
    const { data: logData } = await supabase
      .from("daily_logs")
      .select("sleep_hours, study_hours, mood")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestAssessment(assessmentData);
    setLatestLog(logData);

    if (assessmentData && logData) {
      await fetchRecommendations(assessmentData, logData);
    } else {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (assessment: Assessment, log: DailyLog) => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        body: {
          stress_score: assessment.score,
          risk_level: assessment.risk_level,
          sleep_hours: log.sleep_hours,
          study_hours: log.study_hours,
          mood: log.mood,
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        } else if (error.message?.includes("402")) {
          toast({
            title: "Usage limit reached",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else if (data) {
        setRecommendation(data);
      }
    } catch (err: any) {
      console.error("Error fetching recommendations:", err);
      toast({
        title: "Error",
        description: "Failed to get AI recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (!latestAssessment || !latestLog) return;
    setRefreshing(true);
    await fetchRecommendations(latestAssessment, latestLog);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Generating AI insights...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!latestAssessment || !latestLog) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-xl p-12 text-center">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p className="text-muted-foreground mb-6">
              Complete an assessment and add a daily log to get personalized AI
              recommendations.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.location.href = "/assessment"}>
                Take Assessment
              </Button>
              <Button variant="glow" onClick={() => window.location.href = "/add-log"}>
                Add Daily Log
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Recommendations</h1>
            <p className="text-muted-foreground">
              Personalized insights based on your stress data
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {recommendation && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Summary</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {recommendation.summary}
              </p>
            </div>

            {/* Recommendations */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Lightbulb className="h-5 w-5 text-warning" />
                </div>
                <h2 className="text-lg font-semibold">Recommendations</h2>
              </div>
              <ul className="space-y-3">
                {recommendation.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Breathing Exercise */}
            <div className="glass-card rounded-xl p-6 border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wind className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Breathing Exercise</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {recommendation.breathing_exercise}
              </p>
            </div>

            {/* Grounding Exercise */}
            {recommendation.grounding_exercise && (
              <div className="glass-card rounded-xl p-6 border-cyan/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-cyan/10">
                    <Anchor className="h-5 w-5 text-cyan" />
                  </div>
                  <h2 className="text-lg font-semibold">Grounding Exercise</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {recommendation.grounding_exercise}
                </p>
              </div>
            )}

            {/* Study Break Plan */}
            {recommendation.study_break_plan && (
              <div className="glass-card rounded-xl p-6 border-warning/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Coffee className="h-5 w-5 text-warning" />
                  </div>
                  <h2 className="text-lg font-semibold">Study Break Plan</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Suggested duration: {recommendation.study_break_plan.duration_minutes} minutes
                </p>
                <ul className="space-y-2 mb-4">
                  {recommendation.study_break_plan.activities.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm bg-secondary/50 rounded-lg p-2"
                    >
                      <span className="mt-0.5 text-xs font-semibold text-warning">{idx + 1}.</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Return to focus:</span>{" "}
                  {recommendation.study_break_plan.return_to_focus_tip}
                </div>
              </div>
            )}

            {/* Micro Actions */}
            {recommendation.micro_actions && recommendation.micro_actions.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-success/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-success/10">
                    <ListChecks className="h-5 w-5 text-success" />
                  </div>
                  <h2 className="text-lg font-semibold">Next-Hour Micro Actions</h2>
                </div>
                <ul className="space-y-2">
                  {recommendation.micro_actions.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm bg-secondary/50 rounded-lg p-2"
                    >
                      <span className="mt-0.5 text-xs font-semibold text-success">{idx + 1}.</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Affirmation */}
            {recommendation.positive_affirmation && (
              <div className="glass-card rounded-xl p-6 border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Quote className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Positive Affirmation</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed italic">
                  “{recommendation.positive_affirmation}”
                </p>
              </div>
            )}

            {/* Lifestyle Tip */}
            <div className="glass-card rounded-xl p-6 border-success/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success/10">
                  <Heart className="h-5 w-5 text-success" />
                </div>
                <h2 className="text-lg font-semibold">Lifestyle Tip</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {recommendation.lifestyle_tip}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
