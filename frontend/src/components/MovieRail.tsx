import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieListItem } from "@/types";
import { MovieCard } from "./MovieCard";
import { CardRowSkeleton } from "./Skeletons";
import { EmptyState } from "./States";

interface MovieRailProps {
  title: string;
  icon?: React.ReactNode;
  movies?: MovieListItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  onAddToWatchlist?: (movieId: number) => void;
}

export function MovieRail({ title, icon, movies, isLoading, emptyMessage, onAddToWatchlist }: MovieRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -600 : 600, behavior: "smooth" });
  };

  return (
    <section className="relative py-6">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white sm:text-2xl">
          {icon}
          {title}
        </h2>
        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => scroll("left")}
            aria-label={`Scroll ${title} left`}
            className="rounded-full border border-white/10 p-1.5 text-mist hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label={`Scroll ${title} right`}
            className="rounded-full border border-white/10 p-1.5 text-mist hover:bg-white/5 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 sm:px-8">
          <CardRowSkeleton />
        </div>
      ) : !movies || movies.length === 0 ? (
        <div className="px-4 sm:px-8">
          <EmptyState title="No movies found." message={emptyMessage} />
        </div>
      ) : (
        <div
          ref={scrollRef}
          tabIndex={0}
          role="list"
          aria-label={title}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") scroll("right");
            if (e.key === "ArrowLeft") scroll("left");
          }}
          className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-8"
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onAddToWatchlist={onAddToWatchlist} />
          ))}
        </div>
      )}
    </section>
  );
}
