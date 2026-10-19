import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Star, Clock, Award, Clapperboard, Film, User } from "lucide-react";
import { Hero } from "@/components/Hero";
import { MovieRail } from "@/components/MovieRail";
import { CardRowSkeleton } from "@/components/Skeletons";
import { ErrorState } from "@/components/States";
import { useAuth } from "@/context/AuthContext";
import { fetchHollywoodData } from "@/services/movieService";
import { addToWatchlist } from "@/services/interactionService";
import type { HollywoodData } from "@/types";

export function HollywoodPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<HollywoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchHollywoodData()
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
        <ErrorState title="Unable to load Hollywood movies." onRetry={load} />
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
              <Film className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Cinema Hub</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              Hollywood Spotlight
            </h1>
            <p className="mt-1 text-sm text-mist">
              Experience the pinnacle of sci-fi epics, intense psychological thrillers, and cinematic blockbusters.
            </p>
          </div>
          <Link
            to="/movies?industry=hollywood"
            className="btn-secondary self-start sm:self-auto"
          >
            Browse All Hollywood Movies →
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
          {/* Trending Hollywood */}
          <MovieRail
            title="Trending in Hollywood"
            icon={<Flame className="h-5 w-5 text-marquee" />}
            movies={data?.trending}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Top Rated Hollywood */}
          <MovieRail
            title="Top Rated Hollywood Classics & Epics"
            icon={<Star className="h-5 w-5 text-marquee" />}
            movies={data?.top_rated}
            onAddToWatchlist={handleWatchlist}
          />

          {/* New Releases */}
          <MovieRail
            title="New Hollywood Releases"
            icon={<Clock className="h-5 w-5 text-marquee" />}
            movies={data?.recent}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Modern Classics */}
          <MovieRail
            title="Modern Classics"
            icon={<Award className="h-5 w-5 text-marquee" />}
            movies={data?.classics}
            onAddToWatchlist={handleWatchlist}
          />

          {/* Hollywood Actors Spotlight */}
          <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white sm:text-2xl">
                <User className="h-5 w-5 text-marquee" /> Acclaimed Hollywood Stars
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
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-marquee">
                      {actor.name}
                    </h3>
                    <p className="mt-2 text-xs text-mist">Essential Films:</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {actor.movies?.map((m) => (
                        <span
                          key={m}
                          className="rounded bg-ink-900 px-2 py-0.5 text-xs text-mist-light"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="mt-4 text-xs font-semibold text-marquee">
                    View Filmography →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Directors Spotlight */}
          <section className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white sm:text-2xl">
                <Clapperboard className="h-5 w-5 text-marquee" /> Iconic Visionaries
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
                  <p className="mt-1 text-xs text-mist">Masterpieces:</p>
                  <p className="mt-1 text-sm text-mist-light">
                    {director.movies?.join(" • ")}
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold text-marquee">
                    View Directed Films →
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
