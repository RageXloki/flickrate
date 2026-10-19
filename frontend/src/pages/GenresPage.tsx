import { Link } from "react-router-dom";
import { Clapperboard } from "lucide-react";

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller",
];

export function GenresPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-white">Browse by Genre</h1>
      <p className="mt-2 text-mist">Pick a genre to explore the full catalog.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {GENRES.map((genre) => (
          <Link
            key={genre}
            to={`/movies?genre=${encodeURIComponent(genre)}`}
            className="card-surface group flex h-28 flex-col items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:border-marquee/50"
          >
            <Clapperboard className="h-5 w-5 text-mist group-hover:text-marquee" />
            <span className="font-display font-semibold text-white">{genre}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
