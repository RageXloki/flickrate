import { useState } from "react";
import { Sparkles, Send, Mic } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { CardRowSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/States";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { askAssistant } from "@/services/interactionService";
import type { AssistantResponse } from "@/types";

const EXAMPLE_PROMPTS = [
  "I want a dark psychological thriller from the 2010s.",
  "What should I watch if I liked Interstellar?",
  "Something highly rated and feel-good for a rainy day.",
];

export function AssistantPage() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<Array<{ query: string; response: AssistantResponse }>>([]);
  const [loading, setLoading] = useState(false);

  const { state: voiceState, start: startVoice } = useVoiceSearch((transcript) => setQuery(transcript));

  const ask = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const response = await askAssistant(text);
      setHistory((prev) => [...prev, { query: text, response }]);
      setQuery("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="mb-2 flex items-center gap-2 font-display text-3xl font-bold text-white">
        <Sparkles className="h-7 w-7 text-marquee" /> AI Movie Assistant
      </h1>
      <p className="mb-8 text-mist">Describe what you're in the mood for, in plain language.</p>

      {history.length === 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => ask(prompt)}
              className="rounded-full border border-white/10 bg-ink-800 px-4 py-2 text-sm text-mist-light hover:border-marquee/50 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {history.map((entry, i) => (
          <div key={i}>
            <p className="mb-3 inline-block rounded-2xl rounded-br-sm bg-marquee px-4 py-2 text-sm font-medium text-ink-950">
              {entry.query}
            </p>
            <p className="mb-4 text-sm text-mist">{entry.response.explanation}</p>
            {entry.response.results.length === 0 ? (
              <EmptyState title="No movies found." message="Try describing it a different way, or seed more movies into the catalog." />
            ) : (
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {entry.response.results.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            )}
          </div>
        ))}
        {loading && <CardRowSkeleton />}
      </div>

      <div className="sticky bottom-4 mt-10 flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-3 py-2 shadow-card">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(query)}
          placeholder="I want a dark psychological thriller from the 2010s..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-mist focus:outline-none"
        />
        <button
          onClick={startVoice}
          aria-label="Voice input"
          className={`rounded-full p-2 ${voiceState === "listening" ? "animate-pulse-ring text-marquee" : "text-mist hover:text-white"}`}
        >
          <Mic className="h-4 w-4" />
        </button>
        <button onClick={() => ask(query)} disabled={loading} className="rounded-full bg-marquee p-2 text-ink-950 disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
