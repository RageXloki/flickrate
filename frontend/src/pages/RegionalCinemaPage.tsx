import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Film, Award, TrendingUp, Users, ChevronRight } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { CardSkeleton } from "@/components/Skeletons";
import { fetchRegionalData } from "@/services/movieService";
import type { RegionalData } from "@/types";

export function RegionalCinemaPage() {
  const [data, setData] = useState<RegionalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegionalData()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 space-y-14">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-orange-950/40 via-red-950/30 to-ink-950 p-8 sm:p-12">
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 text-marquee mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Pan-Indian Cinema Universe</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight">
            Indian Regional Cinema
          </h1>
          <p className="mt-3 text-sm sm:text-base text-mist-light leading-relaxed">
            Discover ground-breaking epics, gritty crime thrillers, and heartfelt realism across Tamil, Telugu, Malayalam, Kannada, and Indian language industries.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Tamil", "Telugu", "Malayalam", "Kannada", "Bengali", "Marathi"].map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-marquee/30 bg-marquee/10 px-3.5 py-1 text-xs font-bold text-marquee"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-6 w-48 bg-ink-800 rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, j) => (
                  <CardSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Trending Regional Cinema */}
          {data.trending.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-marquee" />
                  <h2 className="font-display text-xl font-bold text-white">Trending in Regional Cinema</h2>
                </div>
                <Link to="/movies?industry=indian_regional" className="text-xs font-semibold text-marquee hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {data.trending.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          )}

          {/* Top Rated Masterpieces */}
          {data.top_rated.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-marquee" />
                  <h2 className="font-display text-xl font-bold text-white">Highest Rated Regional Masterpieces</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {data.top_rated.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          )}

          {/* Tamil Cinema */}
          {data.tamil.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">Kollywood (Tamil) Cinema</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {data.tamil.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          )}

          {/* Telugu Cinema */}
          {data.telugu.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">Tollywood (Telugu) Cinema</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {data.telugu.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          )}

          {/* Malayalam Cinema */}
          {data.malayalam.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">Mollywood (Malayalam) Cinema</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {data.malayalam.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          )}

          {/* Featured Regional Legends */}
          <section className="card-surface p-6 sm:p-8 rounded-2xl border border-white/10">
            <h2 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-marquee" /> Iconic Actors & Pan-Indian Stars
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.featured_legends.map((actor, idx) => (
                <Link
                  key={idx}
                  to={`/people/${encodeURIComponent(actor.name)}`}
                  className="rounded-xl border border-white/5 bg-ink-900/60 p-4 hover:border-marquee/40 transition-colors block group"
                >
                  <p className="font-bold text-white group-hover:text-marquee transition-colors">{actor.name}</p>
                  <p className="text-xs text-marquee mt-0.5">{actor.industry}</p>
                  <p className="text-xs text-mist mt-2 line-clamp-1">
                    Works: {actor.movies.join(", ")}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Visionary Directors */}
          <section className="card-surface p-6 sm:p-8 rounded-2xl border border-white/10">
            <h2 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Film className="h-5 w-5 text-marquee" /> Visionary Directors
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.visionary_directors.map((dir, idx) => (
                <Link
                  key={idx}
                  to={`/people/${encodeURIComponent(dir.name)}`}
                  className="rounded-xl border border-white/5 bg-ink-900/60 p-4 hover:border-marquee/40 transition-colors block group"
                >
                  <p className="font-bold text-white group-hover:text-marquee transition-colors">{dir.name}</p>
                  <p className="text-xs text-marquee mt-0.5">{dir.industry}</p>
                  <p className="text-xs text-mist mt-2">
                    Key Films: {dir.movies.join(", ")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
