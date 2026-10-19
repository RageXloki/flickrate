import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { MovieCardSkeleton } from "@/components/Skeletons";
import { ErrorState, EmptyState } from "@/components/States";
import { fetchTrending } from "@/services/movieService";
import { addToWatchlist } from "@/services/interactionService";
import { useAuth } from "@/context/AuthContext";
import type { MovieListItem } from "@/types";

export function TrendingPage() {
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<MovieListItem[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const load = () => {
    setStatus("loading");
    fetchTrending()
      .then((data) => { setMovies(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  };

  useEffect(load, []);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-8">
      <h1 className="mb-6 flex items-center gap-2 font-display text-3xl font-bold text-white">
        <Flame className="h-7 w-7 text-marquee" /> Trending Right Now
      </h1>

      {status === "error" ? (
        <ErrorState title="Unable to load movies." onRetry={load} />
      ) : status === "loading" ? (
        <div className="flex flex-wrap gap-4">{Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)}</div>
      ) : movies && movies.length === 0 ? (
        <EmptyState title="No movies found." message="Seed the database to populate trending titles." />
      ) : (
        <div className="flex flex-wrap gap-4">
          {movies?.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onAddToWatchlist={isAuthenticated ? (id) => addToWatchlist(id).catch(() => {}) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
