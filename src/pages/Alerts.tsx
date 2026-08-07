import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  risk_level: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setAlerts(data);
      setLoading(false);
    };

    fetchAlerts();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setAlerts(
        alerts.map((alert) =>
          alert.id === id ? { ...alert, is_read: true } : alert
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setAlerts(alerts.map((alert) => ({ ...alert, is_read: true })));
      toast({ title: "All alerts marked as read" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const getRiskStyles = (level: string) => {
    switch (level) {
      case "high":
        return {
          bg: "bg-destructive/10",
          border: "border-destructive/30",
          icon: "text-destructive",
        };
      case "moderate":
        return {
          bg: "bg-warning/10",
          border: "border-warning/30",
          icon: "text-warning",
        };
      default:
        return {
          bg: "bg-success/10",
          border: "border-success/30",
          icon: "text-success",
        };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Alerts</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}`
                : "No unread alerts"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-6 h-24 shimmer" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts</h3>
            <p className="text-muted-foreground">
              You'll see alerts here when high stress levels are detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const styles = getRiskStyles(alert.risk_level);
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "glass-card rounded-xl p-5 border transition-all duration-300 animate-fade-in",
                    styles.border,
                    !alert.is_read && styles.bg
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-lg", styles.bg)}>
                        <AlertTriangle className={cn("h-5 w-5", styles.icon)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full uppercase",
                              styles.bg,
                              styles.icon
                            )}
                          >
                            {alert.risk_level} risk
                          </span>
                          {!alert.is_read && (
                            <span className="flex h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(alert.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    {!alert.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
