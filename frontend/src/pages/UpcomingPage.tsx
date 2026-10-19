import { useEffect, useState } from "react";
import { Calendar, Sparkles, Film } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { CardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/States";
import { fetchNewReleases } from "@/services/movieService";
import type { MovieListItem } from "@/types";

export function UpcomingPage() {
  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewReleases()
      .then((res) => {
        setMovies(res);
        setLoading(false);
      })
      .catch(() => {
        setMovies([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-marquee mb-1">
          <Calendar className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Release Calendar</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          New Releases & Recent Premieres
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-mist max-w-2xl">
          The freshest theatrical and streaming titles added to the FlickRate catalog, sorted chronologically.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No recent releases found."
          message="Run movie synchronization or seed the database to view recent releases."
        />
      )}
    </div>
  );
}
