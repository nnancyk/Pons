import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const suggestedQuestions = [
  "What tech events are happening this week?",
  "Are there any volunteer opportunities?",
  "What cultural events can I attend?",
  "Find me beginner-friendly sports clubs",
];

const AskAI = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (q: string) => {
    const question = q || query;
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setQuery("");
    setIsLoading(true);

    // Mock AI response for now
    setTimeout(() => {
      const responses: Record<string, string> = {
        tech: "🤖 This week in tech: **Husky Robotics** has an Intro to ROS Workshop on Monday at 6 PM in CSE2 G01, and **ACM @ UW** hosts Competitive Programming Practice on Thursday at 5 PM in CSE1 305!",
        volunteer: "🤝 **Huskies for Habitat** is hosting a Build Day on Saturday at 9 AM in Rainier Valley. Tools and lunch are provided — a great way to give back!",
        cultural: "🎭 **FASA** is holding their Cultural Night Rehearsal on Tuesday at 7 PM in the HUB Ballroom. All performers are welcome to join!",
        sports: "🧗 **UW Climbing Club** has a Bouldering Social every Wednesday at 5:30 PM at the IMA Climbing Wall. All skill levels welcome!",
      };

      const lowerQ = question.toLowerCase();
      let response = "Here are some events happening this week at UW! Try asking about specific categories like tech, cultural, sports, or volunteer events.";

      if (lowerQ.includes("tech")) response = responses.tech;
      else if (lowerQ.includes("volunteer") || lowerQ.includes("service")) response = responses.volunteer;
      else if (lowerQ.includes("cultural")) response = responses.cultural;
      else if (lowerQ.includes("sport") || lowerQ.includes("beginner")) response = responses.sports;

      setMessages((prev) => [...prev, { role: "ai", content: response }]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-[var(--shadow-card)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg text-foreground">Ask about UW Events</h3>
        </div>

        {/* Messages */}
        <div className="p-5 min-h-[200px] max-h-[400px] overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleAsk(q)}
                    className="px-3 py-1.5 text-xs rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse-soft" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse-soft [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse-soft [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about events, clubs, activities..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-body"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskAI;
