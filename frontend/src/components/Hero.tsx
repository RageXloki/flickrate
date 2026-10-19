import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Plus, Info, Heart } from "lucide-react";
import type { MovieListItem } from "@/types";
import { FALLBACK_BACKDROP, formatYear } from "@/utils/format";
import { RatingBadges } from "./RatingBadges";
import { TrailerModal } from "./TrailerModal";

interface HeroProps {
  movie: (MovieListItem & { overview?: string; runtime_minutes?: number | null; release_date?: string | null }) | null;
  onAddToWatchlist?: (movieId: number) => void;
  inWatchlist?: boolean;
}

export function Hero({ movie, onAddToWatchlist, inWatchlist }: HeroProps) {
  const [trailerOpen, setTrailerOpen] = useState(false);

  if (!movie) {
    return <div className="skeleton h-[60vh] min-h-[420px] w-full rounded-none" />;
  }

  const genreText = movie.genres.map((g) => g.name).join(" / ");

  return (
    <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
      <img
        src={movie.backdrop_url || FALLBACK_BACKDROP}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = FALLBACK_BACKDROP;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/30 to-transparent" />

      <div className="relative flex h-full max-w-[1600px] flex-col justify-end gap-4 px-4 pb-14 pt-24 sm:px-8">
        <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-6xl">
          {movie.title}
        </h1>
        <p className="text-sm font-medium text-mist-light sm:text-base">
          {formatYear(movie.release_date ?? null)}
          {movie.runtime_minutes ? ` • ${movie.runtime_minutes} min` : ""}
          {genreText ? ` • ${genreText}` : ""}
        </p>
        <RatingBadges imdb={movie.imdb_rating} rottenTomatoes={movie.rotten_tomatoes_rating} flickrate={movie.flickrate_score} size="md" />
        {movie.overview && <p className="max-w-xl text-sm text-mist-light sm:text-base line-clamp-3">{movie.overview}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button onClick={() => setTrailerOpen(true)} className="btn-primary">
            <Play className="h-4 w-4 fill-current" /> Watch Trailer
          </button>
          <Link to={`/movies/${movie.id}`} className="btn-secondary">
            <Info className="h-4 w-4" /> More Details
          </Link>
          <button onClick={() => onAddToWatchlist?.(movie.id)} className="btn-secondary">
            {inWatchlist ? <Heart className="h-4 w-4 fill-marquee text-marquee" /> : <Plus className="h-4 w-4" />}
            {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </div>

      <TrailerModal movieId={movie.id} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </section>
  );
}
