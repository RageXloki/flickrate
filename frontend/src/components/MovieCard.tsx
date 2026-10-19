import { Link } from "react-router-dom";
import { Play, Plus, Info } from "lucide-react";
import type { MovieListItem } from "@/types";
import { FALLBACK_POSTER } from "@/utils";
import { RatingBadges } from "./RatingBadges";

interface MovieCardProps {
  movie: MovieListItem;
  onAddToWatchlist?: (movieId: number) => void;
}

export function MovieCard({ movie, onAddToWatchlist }: MovieCardProps) {
  return (
    <div className="group relative w-[168px] shrink-0 sm:w-[190px]">
      <Link to={`/movies/${movie.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-800">
          <img
            src={movie.poster_url || FALLBACK_POSTER}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_POSTER;
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex items-center justify-center gap-2 pb-3">
              <span className="rounded-full bg-marquee p-2 text-ink-950 shadow-glow">
                <Play className="h-4 w-4 fill-current" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onAddToWatchlist?.(movie.id);
                }}
                className="rounded-full border border-white/30 p-2 text-white hover:bg-white/10"
                aria-label="Add to watchlist"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="rounded-full border border-white/30 p-2 text-white">
                <Info className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-2 space-y-0.5">
        <Link to={`/movies/${movie.id}`} className="line-clamp-1 text-sm font-medium text-white hover:text-marquee">
          {movie.title}
        </Link>
        <p className="text-xs text-mist">{movie.year ?? "TBA"}</p>
        <RatingBadges imdb={movie.imdb_rating} rottenTomatoes={movie.rotten_tomatoes_rating} flickrate={movie.flickrate_score} />
      </div>
    </div>
  );
}
