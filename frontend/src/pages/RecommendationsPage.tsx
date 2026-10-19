import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ReviewSkeleton } from "@/components/Skeletons";
import { ErrorState, EmptyState } from "@/components/States";
import { useAuth } from "@/context/AuthContext";
import { fetchPersonalizedRecommendations } from "@/services/interactionService";
import type { Recommendation } from "@/types";

export function RecommendationsPage() {
  const { isAuthenticated } = useAuth();
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = () => {
    if (!isAuthenticated) return;
    setStatus("loading");
    fetchPersonalizedRecommendations()
      .then((data) => { setRecs(data.results); setMessage(data.message); setStatus("ready"); })
      .catch(() => setStatus("error"));
  };

  useEffect(load, [isAuthenticated]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="mb-2 flex items-center gap-2 font-display text-3xl font-bold text-white">
        <Sparkles className="h-7 w-7 text-marquee" /> AI Recommendations
      </h1>
      <p className="mb-8 text-mist">
        Content-based recommendations built from TF-IDF similarity, genre, cast, director, and rating signals — every pick comes with its reasoning.
      </p>

      {!isAuthenticated ? (
        <EmptyState
          title="Log in to get personalized recommendations."
          message="New here? Popular picks and explainable 'because you liked X' recommendations are available on every movie page too."
          action={<Link to="/login" className="btn-primary mt-2">Log In</Link>}
        />
      ) : status === "error" ? (
        <ErrorState title="Unable to load recommendations." onRetry={load} />
      ) : status === "loading" ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)}</div>
      ) : (
        <>
          {message && <p className="mb-6 rounded-xl border border-marquee/30 bg-marquee/10 px-4 py-3 text-sm text-marquee">{message}</p>}
          {recs && recs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recs.map((rec) => <RecommendationCard key={rec.movie.id} rec={rec} />)}
            </div>
          ) : (
            <EmptyState title="No recommendations yet." message="Rate a few movies to personalize FlickRate." />
          )}
        </>
      )}
    </div>
  );
}
