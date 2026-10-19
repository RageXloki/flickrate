import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame, TrendingUp, Sparkles, Clapperboard, Globe2, Star, Clock, Gem,
  Smile, Heart, Zap, Ghost, Eye, Laugh
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { MovieRail } from "@/components/MovieRail";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTrending, fetchPopular, fetchTopRated, fetchNewReleases, fetchMovies
} from "@/services/movieService";
import { fetchPersonalizedRecommendations, addToWatchlist } from "@/services/interactionService";
import type { MovieListItem, Recommendation } from "@/types";

const GENRE_SHELVES = ["Action", "Comedy", "Drama", "Science Fiction", "Horror", "Adventure", "Romance", "Crime", "Mystery"];

const MOOD_SHORTCUTS = [
  { key: "happy", label: "Happy", icon: Smile, color: "hover:border-amber-400 text-amber-300" },
  { key: "romantic", label: "Romantic", icon: Heart, color: "hover:border-rose-400 text-rose-300" },
  { key: "exciting", label: "Exciting", icon: Zap, color: "hover:border-orange-400 text-orange-300" },
  { key: "mind-bending", label: "Mind-bending", icon: Eye, color: "hover:border-fuchsia-400 text-fuchsia-300" },
  { key: "scary", label: "Scary", icon: Ghost, color: "hover:border-purple-400 text-purple-300" },
  { key: "funny", label: "Funny", icon: Laugh, color: "hover:border-yellow-400 text-yellow-300" },
];

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const [trending, setTrending] = useState<MovieListItem[] | null>(null);
  const [popular, setPopular] = useState<MovieListItem[] | null>(null);
  const [topRated, setTopRated] = useState<MovieListItem[] | null>(null);
  const [newReleases, setNewReleases] = useState<MovieListItem[] | null>(null);
  const [bollywood, setBollywood] = useState<MovieListItem[] | null>(null);
  const [hollywood, setHollywood] = useState<MovieListItem[] | null>(null);
  const [hiddenGems, setHiddenGems] = useState<MovieListItem[] | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [recMessage, setRecMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const loadAll = () => {
    setError(false);
    fetchTrending().then(setTrending).catch(() => setError(true));
    fetchPopular().then(setPopular).catch(() => setError(true));
    fetchTopRated().then(setTopRated).catch(() => {});
    fetchNewReleases().then(setNewReleases).catch(() => {});
    fetchMovies({ industry: "bollywood", sort: "popularity" }).then((d) => setBollywood(d.results)).catch(() => {});
    fetchMovies({ industry: "hollywood", sort: "popularity" }).then((d) => setHollywood(d.results)).catch(() => {});
    fetchMovies({ min_rating: 8.0, sort: "flickrate" }).then((d) => setHiddenGems(d.results)).catch(() => {});

    if (isAuthenticated) {
      fetchPersonalizedRecommendations()
        .then((d) => {
          setRecommendations(d.results);
          setRecMessage(d.message);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleWatchlist = (movieId: number) => {
    if (!isAuthenticated) return;
    addToWatchlist(movieId).catch(() => {});
  };

  const heroMovie = trending?.[0] ?? popular?.[0] ?? null;

  return (
    <div className="pb-16">
      {/* 1. Cinematic Hero Section */}
      <Hero movie={heroMovie} onAddToWatchlist={handleWatchlist} />

      {error && (
        <div className="mx-auto max-w-2xl px-4 py-6 text-center text-sm text-mist">
          Unable to connect to FlickRate. Some sections may be empty until the connection is restored.
        </div>
      )}

      {/* Mood Discovery Quick Bar */}
      <section className="mx-auto max-w-[1600px] px-4 pt-8 sm:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-ink-900 to-ink-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-marquee">
              <Sparkles className="h-4 w-4" /> AI Mood Discovery
            </span>
            <p className="mt-0.5 text-sm font-semibold text-white">How are you feeling right now?</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {MOOD_SHORTCUTS.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.key}
                  to={`/moods?mood=${m.key}`}
                  className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-950/60 px-3.5 py-1.5 text-xs font-medium text-white transition-all ${m.color} hover:bg-white/5`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{m.label}</span>
                </Link>
              );
            })}
            <Link to="/moods" className="text-xs font-semibold text-marquee hover:underline pl-2">
              All moods →
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Trending Now */}
      <MovieRail
        title="Trending Now"
        icon={<Flame className="h-5 w-5 text-marquee" />}
        movies={trending ?? undefined}
        isLoading={trending === null}
        onAddToWatchlist={handleWatchlist}
      />

      {/* 3. Popular Movies */}
      <MovieRail
        title="Popular Movies"
        icon={<TrendingUp className="h-5 w-5 text-marquee" />}
        movies={popular ?? undefined}
        isLoading={popular === null}
        onAddToWatchlist={handleWatchlist}
      />

      {/* 4. Top Rated */}
      <MovieRail
        title="Top Rated Masterpieces"
        icon={<Star className="h-5 w-5 text-marquee" />}
        movies={topRated ?? undefined}
        isLoading={topRated === null}
        onAddToWatchlist={handleWatchlist}
      />

      {/* 5. New Releases */}
      <MovieRail
        title="New & Recent Releases"
        icon={<Clock className="h-5 w-5 text-marquee" />}
        movies={newReleases ?? undefined}
        isLoading={newReleases === null}
        onAddToWatchlist={handleWatchlist}
      />

      {/* 6. Bollywood Spotlight */}
      <section className="px-4 pt-4 sm:px-8">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-marquee" />
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Bollywood & Indian Cinema
            </h2>
          </div>
          <Link to="/bollywood" className="text-sm font-semibold text-marquee hover:underline">
            Explore Bollywood Hub →
          </Link>
        </div>
      </section>
      <MovieRail
        title=""
        movies={bollywood ?? undefined}
        isLoading={bollywood === null}
        onAddToWatchlist={handleWatchlist}
      />

      {/* 7. Hollywood Spotlight */}
      <section className="px-4 pt-4 sm:px-8">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-marquee" />
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Hollywood Spotlight
            </h2>
          </div>
          <Link to="/hollywood" className="text-sm font-semibold text-marquee hover:underline">
            Explore Hollywood Hub →
          </Link>
        </div>
      </section>
      <MovieRail
        title=""
        movies={hollywood ?? undefined}
        isLoading={hollywood === null}
        onAddToWatchlist={handleWatchlist}
      />

      {/* 8. AI Recommendations For You */}
      <section className="px-4 py-6 sm:px-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white sm:text-2xl">
            <Sparkles className="h-5 w-5 text-marquee" /> Recommended For You
          </h2>
          <Link to="/recommendations" className="text-sm text-marquee hover:text-marquee-bright">
            See all AI picks →
          </Link>
        </div>
        {!isAuthenticated ? (
          <p className="text-sm text-mist">
            <Link to="/login" className="text-marquee hover:underline">Log in</Link> to receive explainable recommendations tuned to your ratings and watchlist.
          </p>
        ) : recMessage ? (
          <p className="text-sm text-mist">{recMessage}</p>
        ) : null}
      </section>
      {isAuthenticated && (
        <MovieRail
          title=""
          movies={recommendations?.map((r) => r.movie)}
          isLoading={recommendations === null}
          onAddToWatchlist={handleWatchlist}
        />
      )}

      {/* 9. Hidden Gems */}
      <MovieRail
        title="Hidden Gems & Critic Favorites"
        icon={<Gem className="h-5 w-5 text-marquee" />}
        movies={hiddenGems ?? undefined}
        isLoading={hiddenGems === null}
        onAddToWatchlist={handleWatchlist}
      />

      {/* 10. Browse by Genre Shelf */}
      <section className="px-4 py-10 sm:px-8">
        <h2 className="mb-4 font-display text-xl font-bold text-white sm:text-2xl">
          Browse by Genre
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {GENRE_SHELVES.map((genre) => (
            <Link
              key={genre}
              to={`/movies?genre=${encodeURIComponent(genre)}`}
              className="card-surface flex h-20 items-center justify-center px-4 text-center font-display font-semibold text-white transition-all hover:border-marquee/50 hover:text-marquee hover:scale-105"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>

      {/* Assistant Promo Banner */}
      <section className="relative overflow-hidden px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-10 text-center shadow-card">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-marquee/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-marquee">
            <Sparkles className="h-3.5 w-3.5" /> AI Natural Language Search
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-white sm:text-3xl">
            Find exactly what you want to watch in plain English.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-mist sm:text-base">
            Ask for "a dark psychological thriller like Shutter Island", "Hindi comedies after 2018", or "movies under 2 hours" — FlickRate understands your taste.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/assistant" className="btn-primary">
              Ask AI Assistant
            </Link>
            <Link to="/moods" className="btn-secondary">
              Explore by Mood
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
