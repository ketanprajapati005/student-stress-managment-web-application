import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Moon, BookOpen, Smile, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DailyLog {
  id: string;
  date: string;
  sleep_hours: number;
  study_hours: number;
  mood: number;
  notes: string | null;
  created_at: string;
}

const moodEmojis = ["😢", "😔", "😐", "🙂", "😊", "😃", "😄", "🤩", "🥳", "🌟"];

export default function Logs() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("daily_logs").delete().eq("id", id);
      if (error) throw error;
      setLogs(logs.filter((log) => log.id !== id));
      toast({ title: "Log deleted" });
    } catch (error: any) {
      toast({
        title: "Error deleting log",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Logs</h1>
          <p className="text-muted-foreground">View your wellness history</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-6 h-48 shimmer" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No logs yet</h3>
            <p className="text-muted-foreground">
              Start tracking your daily wellness by adding your first log.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className="glass-card rounded-xl p-5 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "EEEE")}
                    </p>
                    <p className="font-semibold">
                      {format(new Date(log.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <Moon className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className={cn(
                      "text-lg font-bold",
                      log.sleep_hours >= 7 ? "text-success" : log.sleep_hours >= 5 ? "text-warning" : "text-destructive"
                    )}>
                      {log.sleep_hours}h
                    </p>
                    <p className="text-xs text-muted-foreground">Sleep</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <BookOpen className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{log.study_hours}h</p>
                    <p className="text-xs text-muted-foreground">Study</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <span className="text-xl">{moodEmojis[log.mood - 1]}</span>
                    <p className={cn(
                      "text-lg font-bold",
                      log.mood >= 7 ? "text-success" : log.mood >= 4 ? "text-warning" : "text-destructive"
                    )}>
                      {log.mood}/10
                    </p>
                    <p className="text-xs text-muted-foreground">Mood</p>
                  </div>
                </div>

                {log.notes && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {log.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
