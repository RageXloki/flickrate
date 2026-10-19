import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { MovieCardSkeleton } from "@/components/Skeletons";
import { ErrorState, EmptyState } from "@/components/States";
import { fetchMovies, fetchGenres } from "@/services/movieService";
import { addToWatchlist } from "@/services/interactionService";
import { useAuth } from "@/context/AuthContext";
import type { Genre, MovieListItem } from "@/types";

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "imdb", label: "IMDb" },
  { value: "rotten_tomatoes", label: "Rotten Tomatoes" },
  { value: "flickrate", label: "FlickRate" },
];

export function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<MovieListItem[] | null>(null);
  const [count, setCount] = useState(0);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const genre = searchParams.get("genre") || "";
  const industry = searchParams.get("industry") || "";
  const sort = searchParams.get("sort") || "popularity";
  const minRating = searchParams.get("min_rating") || "";
  const language = searchParams.get("language") || "";
  const yearMin = searchParams.get("year_min") || "";

  useEffect(() => {
    fetchGenres().then(setGenres).catch(() => {});
  }, []);

  const load = () => {
    setStatus("loading");
    fetchMovies({
      search: search || undefined,
      genre: genre || undefined,
      industry: industry || undefined,
      sort: sort as any,
      min_rating: minRating ? Number(minRating) : undefined,
      language: language || undefined,
      year_min: yearMin ? Number(yearMin) : undefined,
      page,
    })
      .then((data) => {
        setMovies(data.results);
        setCount(data.count);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, genre, industry, sort, minRating, language, yearMin, page]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const totalPages = Math.max(1, Math.ceil(count / 20));

  const industries = [
    { key: "", label: "All Cinema" },
    { key: "hollywood", label: "Hollywood" },
    { key: "bollywood", label: "Bollywood" },
    { key: "regional", label: "Regional Indian" },
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {search ? `Results for "${search}"` : "Explore Catalog"}
          </h1>
          <p className="mt-1 text-sm text-mist">
            {count} {count === 1 ? "movie" : "movies"} available with verified ratings & official trailers
          </p>
        </div>
        <button onClick={() => setFiltersOpen((v) => !v)} className="btn-secondary sm:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Industry Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {industries.map((ind) => {
          const isActive = (industry === ind.key) || (!industry && ind.key === "");
          return (
            <button
              key={ind.key}
              onClick={() => updateParam("industry", ind.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-marquee text-ink-950 shadow-glow"
                  : "bg-ink-800 text-mist hover:bg-ink-700 hover:text-white"
              }`}
            >
              {ind.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className={`space-y-6 ${filtersOpen ? "block" : "hidden"} lg:block`}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mist">Industry</label>
            <select value={industry} onChange={(e) => updateParam("industry", e.target.value)} className="input-field">
              <option value="">All Industries</option>
              <option value="hollywood">Hollywood</option>
              <option value="bollywood">Bollywood</option>
              <option value="regional">Indian Regional</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mist">Genre</label>
            <select value={genre} onChange={(e) => updateParam("genre", e.target.value)} className="input-field">
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mist">Minimum Rating</label>
            <select value={minRating} onChange={(e) => updateParam("min_rating", e.target.value)} className="input-field">
              <option value="">Any</option>
              {[9, 8, 7, 6, 5].map((r) => (
                <option key={r} value={r}>{r}+</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mist">Language</label>
            <select value={language} onChange={(e) => updateParam("language", e.target.value)} className="input-field">
              <option value="">Any</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
              <option value="ta">Tamil</option>
              <option value="ml">Malayalam</option>
              <option value="kn">Kannada</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mist">Released After</label>
            <select value={yearMin} onChange={(e) => updateParam("year_min", e.target.value)} className="input-field">
              <option value="">Any year</option>
              {[2020, 2015, 2010, 2000, 1990].map((y) => (
                <option key={y} value={y}>{y}+</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mist">Sort By</label>
            <select value={sort} onChange={(e) => updateParam("sort", e.target.value)} className="input-field">
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </aside>

        <div>
          {status === "error" ? (
            <ErrorState title="Unable to load movies." onRetry={load} />
          ) : status === "loading" ? (
            <div className="flex flex-wrap gap-4">
              {Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)}
            </div>
          ) : movies && movies.length === 0 ? (
            <EmptyState title="No movies found." message="Try adjusting your filters or search terms." />
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                {movies?.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onAddToWatchlist={isAuthenticated ? (id) => addToWatchlist(id).catch(() => {}) : undefined}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParam("page", String(page - 1))}
                    className="btn-secondary disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-mist">Page {page} of {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateParam("page", String(page + 1))}
                    className="btn-secondary disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
