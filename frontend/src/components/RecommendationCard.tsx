import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { Recommendation } from "@/types";
import { FALLBACK_POSTER } from "@/utils/format";
import { RatingBadges } from "./RatingBadges";

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="card-surface flex gap-4 p-4">
      <Link to={`/movies/${rec.movie.id}`} className="shrink-0">
        <img
          src={rec.movie.poster_url || FALLBACK_POSTER}
          alt={rec.movie.title}
          className="h-32 w-20 rounded-lg object-cover"
        />
      </Link>
      <div className="flex-1">
        <Link to={`/movies/${rec.movie.id}`} className="font-display text-base font-semibold text-white hover:text-marquee">
          {rec.movie.title}
        </Link>
        <p className="text-xs text-mist">{rec.movie.year}</p>
        <div className="mt-1">
          <RatingBadges imdb={rec.movie.imdb_rating} rottenTomatoes={rec.movie.rotten_tomatoes_rating} flickrate={rec.movie.flickrate_score} />
        </div>
        <ul className="mt-2 space-y-1">
          {rec.reasons.map((reason, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-mist-light">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-marquee" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
