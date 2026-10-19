import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Star, Clock, Award, Sparkles, User, Clapperboard, Globe2 } from "lucide-react";
import { Hero } from "@/components/Hero";
import { MovieRail } from "@/components/MovieRail";
import { CardRowSkeleton } from "@/components/Skeletons";
import { ErrorState } from "@/components/States";
import { useAuth } from "@/context/AuthContext";
import { fetchBollywoodData } from "@/services/movieService";
import { addToWatchlist } from "@/services/interactionService";
import type { BollywoodData } from "@/types";

export function BollywoodPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<BollywoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchBollywoodData()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleWatchlist = (movieId: number) => {
    if (!isAuthenticated) return;
    addToWatchlist(movieId).catch(() => {});
  };

  if (error) {
    return (
      <div className="py-20">
        <ErrorState title="Unable to load Bollywood movies." onRetry={load} />
      </div>
    );
  }

  const heroMovie = data?.trending?.[0] ?? data?.top_rated?.[0] ?? null;

  return (
    <div className="min-h-screen pb-16">
      {/* Cinematic Hero */}
      {heroMovie && <Hero movie={heroMovie} onAddToWatchlist={handleWatchlist} />}

      {/* Header Banner */}
      <div className="mx-auto max-w-[1600px] px-4 pt-8 sm:px-8">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-marquee">
              <Globe2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Indian Cinema Hub</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              Bollywood & Indian Cinema
            </h1>
            <p className="mt-1 text-sm text-mist">
              Explore timeless classics, blockbusters, and modern regional masterpieces from Hindi, Telugu, Tamil, and Malayalam cinema.
            </p>
          </div>
          <Link
            to="/movies?industry=bollywood"
            className="btn-secondary self-start sm:self-auto"
          >
            Browse All Hindi Movies →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 px-4 py-8 sm:px-8">
          <CardRowSkeleton />
          <CardRowSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Trending Bollywood */}
          <MovieRail
            title="Trending in Bollywood"
            icon={<Flame className="h-5 w-5 text-marquee" />}
            movies={data?.trending}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Top Rated Bollywood */}
          <MovieRail
            title="Top Rated Bollywood Masterpieces"
            icon={<Star className="h-5 w-5 text-marquee" />}
            movies={data?.top_rated}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Indian Regional Cinema Showcase */}
          <MovieRail
            title="Regional Indian Cinema (Telugu, Tamil, Kannada)"
            icon={<Sparkles className="h-5 w-5 text-marquee" />}
            movies={data?.regional}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Recent Releases */}
          <MovieRail
            title="New Bollywood Releases"
            icon={<Clock className="h-5 w-5 text-marquee" />}
            movies={data?.recent}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Classic Bollywood */}
          <MovieRail
            title="Classic Bollywood Cinema"
            icon={<Award className="h-5 w-5 text-marquee" />}
            movies={data?.classics}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Bollywood Stars Spotlight */}
          <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white sm:text-2xl">
                <User className="h-5 w-5 text-marquee" /> Iconic Bollywood Stars
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data?.featured_actors.map((actor) => (
                <Link
                  key={actor.name}
                  to={`/movies?search=${encodeURIComponent(actor.name)}`}
                  className="card-surface group flex flex-col justify-between p-5 transition-all hover:border-marquee/50 hover:bg-ink-700"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-marquee">
                        {actor.name}
                      </h3>
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-mist">
                        {actor.role}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-mist">Key Films:</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {actor.hits?.map((hit) => (
                        <span
                          key={hit}
                          className="rounded bg-ink-900 px-2 py-0.5 text-xs text-mist-light"
                        >
                          {hit}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="mt-4 text-xs font-semibold text-marquee">
                    Explore Filmography →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Celebrated Directors Spotlight */}
          <section className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white sm:text-2xl">
                <Clapperboard className="h-5 w-5 text-marquee" /> Visionary Directors
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {data?.featured_directors.map((director) => (
                <Link
                  key={director.name}
                  to={`/movies?search=${encodeURIComponent(director.name)}`}
                  className="card-surface group p-5 transition-all hover:border-marquee/50 hover:bg-ink-700"
                >
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-marquee">
                    {director.name}
                  </h3>
                  <p className="mt-1 text-xs text-mist">Notable Works:</p>
                  <p className="mt-1 text-sm text-mist-light">
                    {director.movies?.join(" • ")}
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold text-marquee">
                    View Directed Movies →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
