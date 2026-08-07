import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

const API_BASE_URL = "http://localhost:4000/api";

export default function StressPredictor() {
  const [mood, setMood] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [studyHours, setStudyHours] = useState(4);
  const [anxiety, setAnxiety] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/stress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mood,
          sleepHours,
          studyHours,
          anxiety,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to predict stress level");
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to predict stress level. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-destructive";
      case "moderate":
        return "text-warning";
      default:
        return "text-success";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="h-5 w-5" />;
      case "moderate":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Stress Predictor</h1>
          <p className="text-muted-foreground">
            Get AI-powered stress analysis and personalized recommendations
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Your Data</CardTitle>
              <CardDescription>
                Enter your current mood, sleep, study hours, and anxiety level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mood">
                    Mood Level: {mood}/10
                  </Label>
                  <Input
                    id="mood"
                    type="range"
                    min="1"
                    max="10"
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Very Low</span>
                    <span>Very High</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleepHours">
                    Sleep Hours: {sleepHours}h
                  </Label>
                  <Input
                    id="sleepHours"
                    type="range"
                    min="0"
                    max="12"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0h</span>
                    <span>12h</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyHours">
                    Study Hours per Day: {studyHours}h
                  </Label>
                  <Input
                    id="studyHours"
                    type="range"
                    min="0"
                    max="16"
                    value={studyHours}
                    onChange={(e) => setStudyHours(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0h</span>
                    <span>16h</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anxiety">
                    Anxiety Level: {anxiety}/10
                  </Label>
                  <Input
                    id="anxiety"
                    type="range"
                    min="0"
                    max="10"
                    value={anxiety}
                    onChange={(e) => setAnxiety(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>None</span>
                    <span>Very High</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    "Predict Stress Level"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {result && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Stress Score
                      <span className={getRiskColor(result.riskLevel)}>
                        {getRiskIcon(result.riskLevel)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary mb-2">
                        {result.stressScore}
                        <span className="text-2xl text-muted-foreground">/100</span>
                      </div>
                      <div className={`text-lg font-semibold ${getRiskColor(result.riskLevel)}`}>
                        {result.riskLevel.toUpperCase()} Risk
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Explanation</h4>
                      <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Personalized Advice</h4>
                      <p className="text-sm text-muted-foreground">{result.advice}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Immediate Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.immediateActions?.map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Long-term Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.longTermTips?.map((tip: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}

            {!result && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Fill in the form and click "Predict Stress Level" to get your AI-powered analysis
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

