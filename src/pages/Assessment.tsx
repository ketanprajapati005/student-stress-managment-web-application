import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";

const questions = [
  {
    id: 1,
    question: "How often do you feel overwhelmed by your academic workload?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  },
  {
    id: 2,
    question: "How well are you able to concentrate on your studies?",
    options: ["Very well", "Well", "Moderately", "Poorly", "Very poorly"],
  },
  {
    id: 3,
    question: "How often do you experience physical symptoms of stress (headaches, fatigue)?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  },
  {
    id: 4,
    question: "How satisfied are you with your work-life balance?",
    options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
  },
  {
    id: 5,
    question: "How often do you feel anxious about exams or deadlines?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  },
  {
    id: 6,
    question: "How well do you sleep at night?",
    options: ["Very well", "Well", "Moderately", "Poorly", "Very poorly"],
  },
  {
    id: 7,
    question: "How often do you engage in physical exercise?",
    options: ["Daily", "Several times a week", "Weekly", "Rarely", "Never"],
  },
  {
    id: 8,
    question: "How supported do you feel by friends and family?",
    options: ["Very supported", "Supported", "Neutral", "Unsupported", "Very unsupported"],
  },
];

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAnswer = (optionIndex: number) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: optionIndex });
  };

  const calculateScore = () => {
    let totalScore = 0;
    Object.values(answers).forEach((answerIndex) => {
      // Higher index = higher stress (0-4 scale, multiply by 25 to get 0-100 range per question)
      totalScore += answerIndex * 25;
    });
    // Average across all questions
    return Math.round(totalScore / questions.length);
  };

  const getRiskLevel = (score: number): "low" | "moderate" | "high" => {
    if (score <= 30) return "low";
    if (score <= 60) return "moderate";
    return "high";
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);

    const score = calculateScore();
    const riskLevel = getRiskLevel(score);

    try {
      const { error: assessmentError } = await supabase.from("assessments").insert({
        user_id: user.id,
        responses: answers,
        score,
        risk_level: riskLevel,
      });

      if (assessmentError) throw assessmentError;

      // Create alert if high risk
      if (riskLevel === "high") {
        await supabase.from("alerts").insert({
          user_id: user.id,
          risk_level: riskLevel,
          message: `High stress level detected. Score: ${score}/100. Immediate attention recommended.`,
        });
      }

      toast({
        title: "Assessment completed!",
        description: `Your stress score is ${score}/100 (${riskLevel} risk)`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error saving assessment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Stress Assessment</h1>
          <p className="text-muted-foreground">
            Answer these questions to evaluate your stress level
          </p>
        </div>

        {/* Progress bar */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="glass-card rounded-xl p-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-6">
            {questions[currentQuestion].question}
          </h2>

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  answers[questions[currentQuestion].id] === index
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:border-primary/50 hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      answers[questions[currentQuestion].id] === index
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {answers[questions[currentQuestion].id] === index && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button
              variant="glow"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))
              }
              disabled={answers[questions[currentQuestion].id] === undefined}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
