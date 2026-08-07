import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StressScoreCard } from "@/components/dashboard/StressScoreCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StressChart } from "@/components/dashboard/StressChart";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Moon, BookOpen, Smile, ClipboardList } from "lucide-react";
import { format, subDays } from "date-fns";

interface Assessment {
  id: string;
  score: number;
  risk_level: string;
  created_at: string;
}

interface DailyLog {
  id: string;
  date: string;
  sleep_hours: number;
  study_hours: number;
  mood: number;
}

interface Recommendation {
  summary: string;
  recommendations: string[];
  breathing_exercise: string;
  lifestyle_tip: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [latestLog, setLatestLog] = useState<DailyLog | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch latest assessment
      const { data: assessmentData } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessmentData) {
        setLatestAssessment(assessmentData);
      }

      // Fetch all assessments for chart
      const { data: allAssessments } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(10);

      if (allAssessments) {
        setAssessments(allAssessments);
      }

      // Fetch latest daily log
      const { data: logData } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logData) {
        setLatestLog(logData);
      }

      // Fetch AI recommendations if we have assessment data
      if (assessmentData && logData) {
        fetchRecommendations(assessmentData, logData);
      }
    };

    fetchData();
  }, [user]);

  const fetchRecommendations = async (assessment: Assessment, log: DailyLog) => {
    setLoadingRec(true);
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

      if (!error && data) {
        setRecommendation(data);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoadingRec(false);
    }
  };

  const chartData = assessments.map((a) => ({
    date: format(new Date(a.created_at), "MMM d"),
    score: a.score,
  }));

  // Default values if no data
  const currentScore = latestAssessment?.score ?? 0;
  const riskLevel = (latestAssessment?.risk_level ?? "low") as "low" | "moderate" | "high";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your stress levels and wellbeing</p>
        </div>

        {/* Main stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StressScoreCard score={currentScore} riskLevel={riskLevel} />
          <StatsCard
            title="Sleep (Last Log)"
            value={latestLog ? `${latestLog.sleep_hours}h` : "—"}
            subtitle={latestLog && latestLog.sleep_hours >= 7 ? "Good rest" : "Need more sleep"}
            icon={Moon}
            trend={latestLog && latestLog.sleep_hours >= 7 ? "up" : "down"}
          />
          <StatsCard
            title="Study Hours"
            value={latestLog ? `${latestLog.study_hours}h` : "—"}
            subtitle="Today"
            icon={BookOpen}
          />
          <StatsCard
            title="Mood Level"
            value={latestLog ? `${latestLog.mood}/10` : "—"}
            subtitle={latestLog && latestLog.mood >= 7 ? "Feeling good" : "Could be better"}
            icon={Smile}
            trend={latestLog && latestLog.mood >= 7 ? "up" : "neutral"}
          />
        </div>

        {/* Charts and recommendations */}
        <div className="grid gap-6 lg:grid-cols-2">
          {chartData.length > 0 ? (
            <StressChart data={chartData} />
          ) : (
            <div className="glass-card rounded-xl p-6 flex items-center justify-center">
              <div className="text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Complete assessments to see your stress trend
                </p>
              </div>
            </div>
          )}
          <RecommendationCard recommendation={recommendation} isLoading={loadingRec} />
        </div>
      </div>
    </AppLayout>
  );
}
