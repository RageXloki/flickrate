import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, X } from "lucide-react";
import { fetchWatchlist, removeFromWatchlist } from "@/services/interactionService";
import { ErrorState, EmptyState } from "@/components/States";
import { MovieCardSkeleton } from "@/components/Skeletons";
import { RatingBadges } from "@/components/RatingBadges";
import { FALLBACK_POSTER } from "@/utils/format";
import type { WatchlistEntry } from "@/types";

export function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = () => {
    setStatus("loading");
    fetchWatchlist()
      .then((data) => { setEntries(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  const handleRemove = async (movieId: number) => {
    setEntries((prev) => prev?.filter((e) => e.movie.id !== movieId) ?? null);
    await removeFromWatchlist(movieId).catch(load);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <h1 className="mb-8 flex items-center gap-2 font-display text-3xl font-bold text-white">
        <Bookmark className="h-7 w-7 text-marquee" /> Your Watchlist
      </h1>

      {status === "error" ? (
        <ErrorState title="Unable to load your watchlist." onRetry={load} />
      ) : status === "loading" ? (
        <div className="flex flex-wrap gap-4">{Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)}</div>
      ) : entries && entries.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty."
          message="Save movies here to watch later."
          action={<Link to="/movies" className="btn-primary mt-2">Browse Movies</Link>}
        />
      ) : (
        <div className="space-y-3">
          {entries?.map((entry) => (
            <div key={entry.id} className="card-surface flex items-center gap-4 p-3">
              <Link to={`/movies/${entry.movie.id}`}>
                <img src={entry.movie.poster_url || FALLBACK_POSTER} alt={entry.movie.title} className="h-24 w-16 rounded-lg object-cover" />
              </Link>
              <div className="flex-1">
                <Link to={`/movies/${entry.movie.id}`} className="font-display font-semibold text-white hover:text-marquee">
                  {entry.movie.title}
                </Link>
                <p className="text-xs text-mist">{entry.movie.year}</p>
                <div className="mt-1">
                  <RatingBadges imdb={entry.movie.imdb_rating} rottenTomatoes={entry.movie.rotten_tomatoes_rating} flickrate={entry.movie.flickrate_score} />
                </div>
              </div>
              <button
                onClick={() => handleRemove(entry.movie.id)}
                aria-label={`Remove ${entry.movie.title} from watchlist`}
                className="rounded-full p-2 text-mist hover:bg-white/5 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
