import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  MessageSquare,
  Send,
  Shield,
  Moon,
  BookOpen,
  Smile,
  Activity,
  Sparkles,
  SlidersHorizontal,
  Zap,
  Cloud,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type Assessment = {
  score: number;
  risk_level: string;
};

type DailyLog = {
  sleep_hours: number;
  study_hours: number;
  mood: number;
};

const toneOptions = [
  { key: "warm", label: "Supportive", hint: "gentle encouragement" },
  { key: "concise", label: "Concise", hint: "short & direct" },
  { key: "step", label: "Step-by-step", hint: "ordered steps" },
  { key: "coach", label: "Coachy", hint: "direct, no fluff" },
];

// Lightweight on-device coach: rule-based, no external API calls
function buildCoachResponse(
  input: string,
  history: ChatMessage[],
  toneOverride: string,
  assessment?: Assessment,
  log?: DailyLog
) {
  const text = input.toLowerCase();
  const parts: string[] = [];

  const tips: string[] = [];
  const micro: string[] = [];
  const encouragements = [
    "You’ve handled tough days before; today is another rep.",
    "Small wins stack—pick one tiny action and ship it.",
    "You don’t need perfect energy, just a 5-minute start.",
    "Be kind to yourself; steady beats intense.",
    "Progress > perfection. Aim for one solid block.",
    "Calm first, then action. Both can be tiny.",
  ];
  const tones = {
    concise: "Concise & direct",
    step: "Step-by-step",
    warm: "Warm & encouraging",
    coach: "Direct coach",
  };

  // Infer tone requests from user message
  let tone: keyof typeof tones = (toneOverride as keyof typeof tones) || "warm";
  if (text.includes("short") || text.includes("tl;dr") || text.includes("brief")) tone = "concise";
  if (text.includes("steps") || text.includes("step by step") || text.includes("how")) tone = "step";
  if (text.includes("coach") || text.includes("direct") || text.includes("no fluff")) tone = "coach";

  // Detect intent keywords for more tailored suggestions
  const wantsFocus = /focus|study|concentrate|productive/.test(text);
  const wantsCalm = /anxiety|anxious|panic|overwhelm|stressed|stress/.test(text);
  const wantsSleep = /sleep|insomnia|tired|fatigue|rest/.test(text);
  const wantsMotivation = /motivation|lazy|can't start|procrastinate/.test(text);
  const hasDeadline = /deadline|due|exam|test|submission/.test(text);

  // Avoid repeating the exact last assistant message
  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");

  if (log?.sleep_hours !== undefined) {
    if (log.sleep_hours < 7) {
      tips.push("Aim for a 7-9h sleep window; set a fixed shutdown time tonight.");
      micro.push("Set a 30-minute wind-down alarm.", "Put phone away 30 minutes before bed.");
    } else {
      tips.push("Keep your current sleep window steady; consistency beats perfection.");
    }
  }

  if (log?.study_hours !== undefined) {
    if (log.study_hours > 8) {
      tips.push("Use 25/5 or 50/10 focus blocks and stand/stretch each break.");
      micro.push("Schedule a 10-minute walk after your next block.");
    } else if (log.study_hours < 3) {
      tips.push("Plan two short 30-minute focus blocks with clear, small tasks.");
      micro.push("Write the first 3 tasks you can finish in 20 minutes each.");
    }
  }

  if (log?.mood !== undefined && log.mood < 5) {
    tips.push("Mood is low—pair a tiny win with something pleasant (music, sunlight).");
    micro.push("Send a 1-line check-in to a friend.", "Name one thing that is going okay today.");
  }

  // Base on assessment/log
  if (assessment) {
    if (assessment.score > 75 || assessment.risk_level === "high") {
      tips.push("High stress: slow exhale breathing 4-6 breaths, 2 minutes before tasks.");
      micro.push("Do 4-7-8 breathing twice today.");
    } else if (assessment.risk_level === "moderate") {
      tips.push("Moderate stress: keep tasks bite-sized and celebrate small completions.");
    } else {
      tips.push("Stress is manageable—use your energy to close one meaningful task.");
    }
  }

  if (wantsSleep) tips.push("Keep a consistent bedtime and dim screens 30 minutes before sleep.");
  if (wantsFocus) tips.push("Keep tasks 20-30 minutes, then a 5-minute body reset.");
  if (wantsCalm) {
    tips.push("Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 times.");
    micro.push("Grounding: name 5 see, 4 touch, 3 hear, 2 smell, 1 taste.");
  }
  if (wantsMotivation) tips.push("Start with a 5-minute starter task; action creates motivation.");
  if (text.includes("schedule")) tips.push("Pick 3 priorities max for today: 1 main, 2 small.");
  if (hasDeadline) {
    tips.push("Timebox: 25 on / 5 off for three rounds, then reassess.");
    micro.push("Write the first 3 steps needed for the deadline and do step 1 now.");
  }

  if (tips.length === 0) {
    tips.push("Break tasks into 20-30 minute chunks and breathe out longer than you breathe in.");
  }
  if (micro.length === 0) {
    micro.push("Stand up and stretch for 60 seconds.", "Drink a glass of water.", "Write the next tiny step.");
  }

  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  parts.push(`Style: ${tones[tone]}`);
  parts.push("Here’s a quick plan:");
  parts.push(`- Focus tips: ${tips.slice(0, 4).join(" / ")}`);
  parts.push(`- Micro-actions (next hour): ${micro.slice(0, 4).join(" | ")}`);
  if (assessment) {
    parts.push(
      `- Context: stress ${assessment.score}/100 (${assessment.risk_level})` +
        (log ? `, sleep ${log.sleep_hours}h, study ${log.study_hours}h, mood ${log.mood}/10` : "")
    );
  }
  parts.push(`- Encouragement: ${encouragement}`);
  parts.push("If you feel stuck, reply with your blocker and I’ll simplify it further.");

  // Reduce repetition vs last assistant reply
  if (lastAssistant?.content && parts.join("\n") === lastAssistant.content) {
    parts.push("Variant: try a 10-minute walk, then one 20-minute focus block.");
  }

  // Tone-specific formatting tweaks
  if (tone === "step") {
    return parts
      .map((line) => line.replace("- ", "• "))
      .join("\n");
  }
  if (tone === "concise") {
    return parts
      .filter((_, idx) => idx < 6)
      .join("\n");
  }
  return parts.join("\n");
}

export default function Coach() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [assessment, setAssessment] = useState<Assessment | undefined>();
  const [log, setLog] = useState<DailyLog | undefined>();
  const [sending, setSending] = useState(false);
  const [tone, setTone] = useState("warm");
  const [mode, setMode] = useState<"api" | "local">("api");
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadContext = async () => {
      setLoading(true);
      const [{ data: assessmentData }, { data: logData }] = await Promise.all([
        supabase
          .from("assessments")
          .select("score, risk_level")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("daily_logs")
          .select("sleep_hours, study_hours, mood")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setAssessment(assessmentData || undefined);
      setLog(logData || undefined);

      // Test API availability
      try {
        const { error: testError } = await supabase.functions.invoke("ai-coach", {
          body: { message: "test", history: [] },
        });
        if (testError) {
          console.warn("API not available, falling back to local mode:", testError);
          setApiAvailable(false);
          setMode("local");
        }
      } catch (err) {
        console.warn("API test failed, using local mode:", err);
        setApiAvailable(false);
        setMode("local");
      }

      const intro: ChatMessage = {
        role: "assistant",
        content: mode === "api" && apiAvailable
          ? "I'm your comprehensive student wellness coach powered by Gemini AI! 🌟\n\nI can help you with:\n• Stress management & mental health\n• Study techniques & academic performance\n• Productivity & time management\n• Sleep optimization\n• Motivation & procrastination\n• Work-life balance\n• Healthy habits & wellness\n• Exam preparation\n• Focus & concentration\n• Goal setting & more!\n\nAsk me anything about your student life, and I'll provide personalized advice based on your data!"
          : "I'm your on-device coach. No external AI keys are needed—everything here is local and rule-based. Ask me about stress, focus, breaks, sleep, study tips, productivity, or wellness and I'll tailor tips to your latest data.",
      };
      setMessages([intro]);
      setLoading(false);
    };

    loadContext();
  }, [user]);

  const contextChips = useMemo(() => {
    const chips: { label: string; icon: React.ComponentType<any> }[] = [];
    if (assessment) {
      chips.push({
        label: `Stress ${assessment.score}/100 (${assessment.risk_level})`,
        icon: Shield,
      });
    }
    if (log) {
      chips.push({ label: `Sleep ${log.sleep_hours}h`, icon: Moon });
      chips.push({ label: `Study ${log.study_hours}h`, icon: BookOpen });
      chips.push({ label: `Mood ${log.mood}/10`, icon: Smile });
    }
    return chips;
  }, [assessment, log]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setSending(true);
    
    try {
      let response: string;
      
      if (mode === "api" && apiAvailable) {
        // Use Gemini API through backend function
        const { data, error } = await supabase.functions.invoke("ai-coach", {
          body: {
            message: input.trim(),
            history: updatedMessages.slice(0, -1).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: assessment && log
              ? {
                  stress_score: assessment.score,
                  risk_level: assessment.risk_level,
                  sleep_hours: log.sleep_hours,
                  study_hours: log.study_hours,
                  mood: log.mood,
                }
              : undefined,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.reply) {
          throw new Error("No reply from AI");
        }

        response = data.reply;
      } else {
        // Use local rule-based response
        response = buildCoachResponse(input, updatedMessages, tone, assessment, log);
      }

      const assistantMessage: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
      setInput("");
    } catch (err: any) {
      console.error(err);
      
      // Fallback to local if API fails
      if (mode === "api") {
        toast({
          title: "API unavailable",
          description: "Switching to local mode. Please configure GEMINI_API_KEY for API features.",
          variant: "default",
        });
        setApiAvailable(false);
        setMode("local");
        const localResponse = buildCoachResponse(input, updatedMessages, tone, assessment, log);
        const assistantMessage: ChatMessage = { role: "assistant", content: localResponse };
        setMessages((prev) => [...prev, assistantMessage]);
        setInput("");
      } else {
        toast({
          title: "Coach error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading your latest context…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Coach</h1>
            <p className="text-muted-foreground">
              {mode === "api" && apiAvailable
                ? "Powered by Gemini API for personalized, contextual responses."
                : "Chat Q&A powered by on-device rules. No external API key required."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={mode} onValueChange={(val: "api" | "local") => setMode(val)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    <span>Gemini API</span>
                  </div>
                </SelectItem>
                <SelectItem value="local">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Local Mode</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="gap-2">
              {mode === "api" && apiAvailable ? (
                <>
                  <Zap className="h-4 w-4 text-primary" />
                  API Active
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 text-primary" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="secondary" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Tone:
          </Badge>
          {toneOptions.map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              variant={tone === opt.key ? "default" : "outline"}
              onClick={() => setTone(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {contextChips.length > 0 ? (
            contextChips.map(({ label, icon: Icon }) => (
              <Badge key={label} variant="secondary" className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary">No recent data—answers will stay general.</Badge>
          )}
        </div>

        {/* Topic Suggestions */}
        {mode === "api" && apiAvailable && (
          <div className="glass-card rounded-xl p-4 border border-border/60">
            <p className="text-sm font-medium mb-3 text-muted-foreground">Quick Topics:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "How can I improve my study focus?",
                "Tips for better sleep?",
                "How to manage exam stress?",
                "Productivity techniques?",
                "Work-life balance advice?",
                "Motivation when feeling stuck?",
              ].map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(topic);
                  }}
                  className="text-xs"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 space-y-4 border border-border/60">
          <div className="h-[420px] overflow-y-auto pr-2 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={
                  msg.role === "assistant"
                    ? "flex items-start gap-3"
                    : "flex items-start gap-3 justify-end"
                }
              >
                {msg.role === "assistant" && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={
                    msg.role === "assistant"
                      ? "bg-secondary/60 text-foreground rounded-lg px-4 py-3 text-sm leading-relaxed max-w-[80%]"
                      : "bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm leading-relaxed max-w-[80%]"
                  }
                >
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {line}
                    </p>
                  ))}
                </div>
                {msg.role === "user" && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder={mode === "api" && apiAvailable 
                ? "Ask about stress, study tips, productivity, sleep, motivation, time management, wellness, or anything about student life..."
                : "Ask about stress, focus, breaks, sleep, study tips, or productivity..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

