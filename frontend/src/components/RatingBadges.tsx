import { Star, Sparkles } from "lucide-react";
import { formatScore } from "@/utils/format";

interface RatingBadgesProps {
  imdb: number | string | null;
  rottenTomatoes: number | string | null;
  flickrate: number | string | null;
  size?: "sm" | "md";
}

export function RatingBadges({ imdb, rottenTomatoes, flickrate, size = "sm" }: RatingBadgesProps) {
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const imdbStr = formatScore(imdb, 1, "Not available");
  const flickrateStr = formatScore(flickrate, 1, "—");
  const rtNum = rottenTomatoes !== null && rottenTomatoes !== undefined && rottenTomatoes !== "" ? Math.round(Number(rottenTomatoes)) : null;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${textSize} text-mist`}>
      <span className="inline-flex items-center gap-1">
        <Star className="h-3.5 w-3.5 fill-marquee text-marquee" />
        <span>{imdbStr}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <span aria-hidden="true">🍅</span>
        <span>{rtNum !== null && !Number.isNaN(rtNum) ? `${rtNum}%` : "Not available"}</span>
      </span>
      <span className="inline-flex items-center gap-1 font-semibold text-white">
        <Sparkles className="h-3.5 w-3.5 text-marquee" />
        <span>{flickrateStr}</span>
      </span>
    </div>
  );
}
