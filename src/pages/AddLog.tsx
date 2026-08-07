import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Moon, BookOpen, Smile, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const moodEmojis = ["😢", "😔", "😐", "🙂", "😊", "😃", "😄", "🤩", "🥳", "🌟"];

export default function AddLog() {
  const [sleepHours, setSleepHours] = useState(7);
  const [studyHours, setStudyHours] = useState(4);
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("daily_logs").insert({
        user_id: user.id,
        sleep_hours: sleepHours,
        study_hours: studyHours,
        mood,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Log saved!",
        description: "Your daily log has been recorded.",
      });

      navigate("/logs");
    } catch (error: any) {
      toast({
        title: "Error saving log",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Add Daily Log</h1>
          <p className="text-muted-foreground">Record your daily wellness metrics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sleep Hours */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <Label className="text-lg font-medium">Sleep Hours</Label>
            </div>
            <div className="space-y-3">
              <Slider
                value={[sleepHours]}
                onValueChange={(val) => setSleepHours(val[0])}
                min={0}
                max={12}
                step={0.5}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">0h</span>
                <span className={cn(
                  "font-semibold text-lg",
                  sleepHours >= 7 ? "text-success" : sleepHours >= 5 ? "text-warning" : "text-destructive"
                )}>
                  {sleepHours}h
                </span>
                <span className="text-muted-foreground">12h</span>
              </div>
            </div>
          </div>

          {/* Study Hours */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <Label className="text-lg font-medium">Study Hours</Label>
            </div>
            <div className="space-y-3">
              <Slider
                value={[studyHours]}
                onValueChange={(val) => setStudyHours(val[0])}
                min={0}
                max={16}
                step={0.5}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">0h</span>
                <span className="font-semibold text-lg text-primary">{studyHours}h</span>
                <span className="text-muted-foreground">16h</span>
              </div>
            </div>
          </div>

          {/* Mood */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smile className="h-5 w-5 text-primary" />
              </div>
              <Label className="text-lg font-medium">Mood Level</Label>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center text-5xl">{moodEmojis[mood - 1]}</div>
              <Slider
                value={[mood]}
                onValueChange={(val) => setMood(val[0])}
                min={1}
                max={10}
                step={1}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">😢 Low</span>
                <span className={cn(
                  "font-semibold text-lg",
                  mood >= 7 ? "text-success" : mood >= 4 ? "text-warning" : "text-destructive"
                )}>
                  {mood}/10
                </span>
                <span className="text-muted-foreground">High 🌟</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <Label htmlFor="notes" className="text-lg font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling today? Any specific stressors?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            type="submit"
            variant="glow"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Daily Log
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
