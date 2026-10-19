import { useEffect, useState } from "react";
import { Award, Sparkles, Filter } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { CardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/States";
import { fetchTopRated } from "@/services/movieService";
import type { MovieListItem } from "@/types";

export function TopRatedPage() {
  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [filterIndustry, setFilterIndustry] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopRated()
      .then((res) => {
        setMovies(res);
        setLoading(false);
      })
      .catch(() => {
        setMovies([]);
        setLoading(false);
      });
  }, []);

  const filtered = filterIndustry === "all"
    ? movies
    : movies.filter((m) => m.industry === filterIndustry);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-marquee mb-1">
          <Award className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Hall of Fame</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          Highest-Rated Masterpieces
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-mist max-w-2xl">
          The definitive top films ranked by the transparent FlickRate Score combining verified IMDb ratings, Rotten Tomatoes critic scores, and community consensus.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {[
          { key: "all", label: "All Cinema" },
          { key: "hollywood", label: "Hollywood" },
          { key: "bollywood", label: "Bollywood" },
          { key: "indian_regional", label: "Regional Cinema" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterIndustry(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filterIndustry === tab.key
                ? "bg-marquee text-ink-950 shadow-glow"
                : "text-mist hover:text-white bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No movies found for this category."
          message="Seed more movies into the database to populate the top-rated hall of fame."
        />
      )}
    </div>
  );
}
