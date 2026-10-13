import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, MessageSquare, Bot } from "lucide-react";
import { postApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};


export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI wellness coach. I can help you with stress management, study tips, productivity, sleep, motivation, and more. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    // Scroll only the message list; scrollIntoView would also scroll the whole page
    // and push the header out of view.
    const list = messagesRef.current;
    list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await postApi<{ reply: string }>("/ai/chat", {
        message: userMessage.content,
        history: history.slice(-10), // Last 10 messages for context
      });
      const assistantMessage: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to get AI response. Please try again."),
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">
            Chat with your AI wellness coach
          </p>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-4 border border-border/60">
          <div ref={messagesRef} className="h-[min(500px,55vh)] overflow-y-auto pr-2 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-3 text-sm leading-relaxed max-w-[80%] ${
                    msg.role === "assistant"
                      ? "bg-secondary/60 text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {line}
                    </p>
                  ))}
                </div>
                {msg.role === "user" && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-secondary/60 rounded-lg px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder="Ask me anything about stress, study tips, productivity, wellness..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

