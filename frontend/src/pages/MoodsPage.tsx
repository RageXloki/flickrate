import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Smile, Frown, Heart, Zap, Ghost, Coffee, Compass,
  Eye, Droplets, Laugh, Sparkles
} from "lucide-react";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ReviewSkeleton } from "@/components/Skeletons";
import { ErrorState, EmptyState } from "@/components/States";
import { fetchMoodRecommendations } from "@/services/movieService";
import type { MoodData } from "@/types";

interface MoodConfig {
  key: string;
  label: string;
  icon: typeof Smile;
  color: string;
  borderHover: string;
  badgeBg: string;
  description: string;
}

const MOODS_CONFIG: MoodConfig[] = [
  {
    key: "happy",
    label: "Happy",
    icon: Smile,
    color: "from-amber-500/20 to-yellow-500/10 text-amber-300",
    borderHover: "hover:border-amber-400/50",
    badgeBg: "bg-amber-500/20 text-amber-300",
    description: "Feel-good stories, bright laughter, and joyful adventures",
  },
  {
    key: "sad",
    label: "Sad",
    icon: Frown,
    color: "from-blue-600/20 to-indigo-600/10 text-blue-300",
    borderHover: "hover:border-blue-400/50",
    badgeBg: "bg-blue-500/20 text-blue-300",
    description: "Poignant, melancholic dramas and deep tearjerkers",
  },
  {
    key: "romantic",
    label: "Romantic",
    icon: Heart,
    color: "from-rose-500/20 to-pink-500/10 text-rose-300",
    borderHover: "hover:border-rose-400/50",
    badgeBg: "bg-rose-500/20 text-rose-300",
    description: "Passionate connections, heartfelt chemistry, and love stories",
  },
  {
    key: "exciting",
    label: "Exciting",
    icon: Zap,
    color: "from-red-600/20 to-orange-500/10 text-orange-300",
    borderHover: "hover:border-orange-400/50",
    badgeBg: "bg-orange-500/20 text-orange-300",
    description: "Adrenaline-fueled action spectacles, high-speed heists, and battles",
  },
  {
    key: "scary",
    label: "Scary",
    icon: Ghost,
    color: "from-purple-900/30 to-violet-900/20 text-purple-300",
    borderHover: "hover:border-purple-400/50",
    badgeBg: "bg-purple-500/20 text-purple-300",
    description: "Spine-chilling supernatural curses, dark folklore, and dread",
  },
  {
    key: "relaxing",
    label: "Relaxing",
    icon: Coffee,
    color: "from-emerald-600/20 to-teal-600/10 text-emerald-300",
    borderHover: "hover:border-emerald-400/50",
    badgeBg: "bg-emerald-500/20 text-emerald-300",
    description: "Gentle road trips, soothing soundscapes, and calming comfort films",
  },
  {
    key: "inspirational",
    label: "Inspirational",
    icon: Compass,
    color: "from-cyan-600/20 to-sky-600/10 text-cyan-300",
    borderHover: "hover:border-cyan-400/50",
    badgeBg: "bg-cyan-500/20 text-cyan-300",
    description: "Triumphant true stories, perseverance against all odds, and heroes",
  },
  {
    key: "mind-bending",
    label: "Mind-bending",
    icon: Eye,
    color: "from-fuchsia-600/20 to-purple-600/10 text-fuchsia-300",
    borderHover: "hover:border-fuchsia-400/50",
    badgeBg: "bg-fuchsia-500/20 text-fuchsia-300",
    description: "Twisty paradoxes, dream worlds, wormholes, and reality-shifters",
  },
  {
    key: "emotional",
    label: "Emotional",
    icon: Droplets,
    color: "from-indigo-500/20 to-rose-500/10 text-indigo-300",
    borderHover: "hover:border-indigo-400/50",
    badgeBg: "bg-indigo-500/20 text-indigo-300",
    description: "Heartwarming bonds, family sacrifices, and bittersweet endings",
  },
  {
    key: "funny",
    label: "Funny",
    icon: Laugh,
    color: "from-yellow-500/20 to-amber-500/10 text-yellow-300",
    borderHover: "hover:border-yellow-400/50",
    badgeBg: "bg-yellow-500/20 text-yellow-300",
    description: "Clever satire, hilarious buddy humor, and laugh-out-loud antics",
  },
];

export function MoodsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMoodKey = searchParams.get("mood") || "happy";
  const [moodData, setMoodData] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadMood = (mood: string) => {
    setLoading(true);
    setError(false);
    fetchMoodRecommendations(mood)
      .then((data) => {
        setMoodData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMood(activeMoodKey);
  }, [activeMoodKey]);

  const setMood = (key: string) => {
    setSearchParams({ mood: key });
  };

  const currentConfig = MOODS_CONFIG.find((m) => m.key === activeMoodKey) ?? MOODS_CONFIG[0];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
      {/* Header */}
      <div className="mb-8 max-w-2xl">
        <div className="flex items-center gap-2 text-marquee">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Mood Engine</span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">
          What are you in the mood for?
        </h1>
        <p className="mt-2 text-sm text-mist">
          Select an emotional vibe to receive AI-curated movie recommendations tuned to your current feeling.
        </p>
      </div>

      {/* Mood Selector Cards */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
        {MOODS_CONFIG.map((m) => {
          const Icon = m.icon;
          const isActive = m.key === activeMoodKey;
          return (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              className={`group relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                isActive
                  ? `border-marquee bg-gradient-to-br ${m.color} shadow-glow scale-[1.02]`
                  : `border-white/10 bg-ink-800 ${m.borderHover} hover:bg-ink-700`
              }`}
            >
              <div
                className={`mb-2 rounded-full p-2.5 ${
                  isActive ? "bg-marquee text-ink-950" : "bg-white/5 text-mist group-hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-display text-sm font-bold text-white">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Mood Banner */}
      <div
        className={`mb-8 rounded-2xl border border-white/10 bg-gradient-to-r ${currentConfig.color} p-6`}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-marquee/20 p-2 text-marquee">
            <CurrentIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              {currentConfig.label} Mood Spotlight
            </h2>
            <p className="text-sm text-mist-light">
              {currentConfig.description} • Tone: {moodData?.tone || "curated"}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {error ? (
        <ErrorState title="Unable to load mood recommendations." onRetry={() => loadMood(activeMoodKey)} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      ) : moodData && moodData.results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {moodData.results.map((rec) => (
            <RecommendationCard key={rec.movie.id} rec={rec} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${currentConfig.label} movies found.`}
          message="Try selecting another mood or browsing by genre."
        />
      )}
    </div>
  );
}
