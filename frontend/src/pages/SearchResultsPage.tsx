import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Filter, RotateCcw, Sparkles, Mic, Film } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { CardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/States";
import { fetchMovies, fetchGenres } from "@/services/movieService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import type { MovieListItem, Genre } from "@/types";

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const qParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(qParam);
  const debouncedQuery = useDebouncedValue(query, 300);

  const [selectedGenre, setSelectedGenre] = useState<string>(searchParams.get("genre") || "");
  const [selectedIndustry, setSelectedIndustry] = useState<string>(searchParams.get("industry") || "");
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get("min_rating")) || 0);
  const [sort, setSort] = useState<"popularity" | "newest" | "flickrate">("popularity");

  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  const { state: voiceState, start: startVoice, stop: stopVoice, isSupported: voiceSupported } = useVoiceSearch((text) => {
    setQuery(text);
  });
  const listening = voiceState === "listening";

  useEffect(() => {
    fetchGenres().then(setGenres).catch(() => {});
  }, []);

  const effectiveQuery = debouncedQuery.trim() || qParam.trim();

  useEffect(() => {
    setLoading(true);
    fetchMovies({
      search: effectiveQuery || undefined,
      genre: selectedGenre || undefined,
      industry: selectedIndustry || undefined,
      min_rating: minRating > 0 ? minRating : undefined,
      sort,
    })
      .then((res) => {
        setMovies(res.results);
        setTotalCount(res.count);
        setLoading(false);
      })
      .catch(() => {
        setMovies([]);
        setTotalCount(0);
        setLoading(false);
      });
  }, [effectiveQuery, selectedGenre, selectedIndustry, minRating, sort]);

  const resetFilters = () => {
    setQuery("");
    setSelectedGenre("");
    setSelectedIndustry("");
    setMinRating(0);
    setSort("popularity");
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl flex items-center gap-2">
          <Search className="h-6 w-6 text-marquee" /> Search Movie Catalog
        </h1>
        <p className="mt-1 text-xs text-mist">
          Discover films across Hollywood, Bollywood, and Regional cinema with real-time multifaceted filtering.
        </p>
      </div>

      {/* Main Search Input & Voice Assistant Trigger */}
      <div className="mb-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by movie title, actor, director, or keyword..."
            className="input-field pl-10 pr-12 text-sm sm:text-base py-3"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-mist pointer-events-none" />
          {voiceSupported && (
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                listening ? "bg-red-500 text-white animate-pulse" : "text-mist hover:text-white"
              }`}
              title={listening ? "Listening... click to stop" : "Voice search"}
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 card-surface p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Industry Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase text-mist block mb-1">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-white"
            >
              <option value="">All Industries</option>
              <option value="hollywood">Hollywood</option>
              <option value="bollywood">Bollywood</option>
              <option value="indian_regional">Indian Regional</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase text-mist block mb-1">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-white"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Min Rating Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase text-mist block mb-1">Min Score</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-white"
            >
              <option value="0">Any Rating</option>
              <option value="7">7+ ★ High Quality</option>
              <option value="8">8+ ★ Masterpiece</option>
              <option value="9">9+ ★ All-Time Great</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[11px] font-bold uppercase text-mist block mb-1">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-lg border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-white"
            >
              <option value="popularity">Most Popular</option>
              <option value="flickrate">Highest FlickRate Score</option>
              <option value="newest">Release Date</option>
            </select>
          </div>
        </div>

        {(query || selectedGenre || selectedIndustry || minRating > 0) && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-mist hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Results Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-mist font-medium">
          Found <span className="text-white font-bold">{totalCount}</span> title{totalCount === 1 ? "" : "s"}
          {debouncedQuery && <span> matching "<span className="text-marquee font-bold">{debouncedQuery}</span>"</span>}
        </span>
      </div>

      {/* Movies Grid */}
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
          title="No movies found matching your search."
          message="Try adjusting your keywords or clearing the active filters."
          action={
            <button onClick={resetFilters} className="btn-primary mt-2">
              <RotateCcw className="h-4 w-4" /> Reset Filters
            </button>
          }
        />
      )}
    </div>
  );
}
