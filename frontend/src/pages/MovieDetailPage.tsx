import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Play, Plus, Check, Star, Info, Sparkles, Award, Share2,
  Flag, Eye, Film, Clapperboard, Video, MessageSquare,
  Users, DollarSign, Calendar, Clock, Globe, Shield, ExternalLink,
  ChevronRight, X
} from "lucide-react";
import { DetailSkeleton, ReviewSkeleton } from "@/components/Skeletons";
import { ErrorState, EmptyState } from "@/components/States";
import { TrailerModal } from "@/components/TrailerModal";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { useAuth } from "@/context/AuthContext";
import { fetchMovie, rateMovieDirect, trackInteraction } from "@/services/movieService";
import {
  fetchSimilarMovies,
  addToWatchlist,
  removeFromWatchlist,
  markMovieWatched,
  unmarkMovieWatched,
} from "@/services/interactionService";
import { formatRuntime, formatYear, formatScore, FALLBACK_BACKDROP, FALLBACK_POSTER } from "@/utils/format";
import type { MovieDetail, Recommendation, MovieVideo } from "@/types";

type DetailTab =
  | "overview"
  | "cast"
  | "ratings"
  | "critic_reviews"
  | "audience_reviews"
  | "videos"
  | "similar";

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "notfound">("loading");
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // Video playback
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  // Recommendations
  const [similar, setSimilar] = useState<Recommendation[] | null>(null);
  const [reviewsKey, setReviewsKey] = useState(0);

  // User Actions
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Share & Report Modals
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("incorrect_metadata");
  const [reportSent, setReportSent] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const load = () => {
    if (!id) return;
    setStatus("loading");
    fetchMovie(id)
      .then((data) => {
        setMovie(data);
        setStatus("ready");
        trackInteraction(data.id, "view").catch(() => {});
        fetchSimilarMovies(data.id).then((r) => setSimilar(r.results)).catch(() => setSimilar([]));
      })
      .catch((err) => setStatus(err?.response?.status === 404 ? "notfound" : "error"));
  };

  useEffect(load, [id]);

  const handleRate = async (star: number) => {
    if (!movie || !isAuthenticated) return;
    setIsSubmittingRating(true);
    try {
      const res = await rateMovieDirect(movie.id, star);
      setMovie((prev) =>
        prev
          ? {
              ...prev,
              user_rating: star,
              flickrate_score: res.flickrate_score,
            }
          : null
      );
      setReviewsKey((k) => k + 1);
      showToast(`Rated ${star}/10! Thank you.`);
    } catch {
      showToast("Unable to submit rating.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!movie || !isAuthenticated) return;
    try {
      if (inWatchlist) {
        await removeFromWatchlist(movie.id);
        setInWatchlist(false);
        showToast("Removed from Watchlist.");
      } else {
        await addToWatchlist(movie.id);
        setInWatchlist(true);
        showToast("Added to your Watchlist!");
      }
    } catch {
      showToast("Could not update watchlist.");
    }
  };

  const handleWatchedToggle = async () => {
    if (!movie || !isAuthenticated) return;
    try {
      if (isWatched) {
        await unmarkMovieWatched(movie.id);
        setIsWatched(false);
        showToast("Removed from Watched history.");
      } else {
        await markMovieWatched(movie.id);
        setIsWatched(true);
        showToast("Marked as Watched! Added to your viewing history.");
      }
    } catch {
      showToast("Could not update watched history.");
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!");
    }
    setShareOpen(true);
  };

  if (status === "loading") return <DetailSkeleton />;
  if (status === "notfound") return <div className="px-4 py-20 text-center"><EmptyState title="Movie not found." /></div>;
  if (status === "error" || !movie) return <div className="px-4 py-20"><ErrorState title="Unable to load movies." onRetry={load} /></div>;

  const dist = movie.rating_distribution || {};
  const totalRatingsCount = Object.values(dist).reduce((acc, n) => acc + (Number(n) || 0), 0);

  const TABS = [
    { key: "overview", label: "Overview", icon: Clapperboard },
    { key: "cast", label: `Cast & Crew (${(movie.cast_details || movie.cast || []).length})`, icon: Users },
    { key: "ratings", label: "Multi-Source Ratings", icon: Award },
    { key: "critic_reviews", label: `Critic Reviews (${(movie.critic_reviews || []).length})`, icon: Sparkles },
    { key: "audience_reviews", label: `Audience Reviews (${movie.review_count || 0})`, icon: MessageSquare },
    { key: "videos", label: `Trailers & Videos (${(movie.videos || []).length})`, icon: Video },
    { key: "similar", label: "More Like This", icon: Film },
  ];

  return (
    <div className="pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-marquee px-4 py-3 text-sm font-bold text-ink-950 shadow-glow animate-fade-in flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Backdrop Banner */}
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <img
          src={movie.backdrop_url || FALLBACK_BACKDROP}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_BACKDROP; }}
        />
        <div className="absolute inset-0 bg-fade-bottom" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/70 to-transparent" />
      </div>

      <div className="mx-auto -mt-44 max-w-6xl px-4 sm:px-8 relative z-10">
        {/* Top Header Card */}
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="relative group shrink-0 self-center sm:self-end">
            <img
              src={movie.poster_url || FALLBACK_POSTER}
              alt={movie.title}
              className="h-72 w-48 rounded-2xl object-cover shadow-card ring-1 ring-white/10 sm:h-96 sm:w-64"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_POSTER; }}
            />
            {movie.trailer_url && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
              >
                <span className="rounded-full bg-marquee p-3 text-ink-950 shadow-glow">
                  <Play className="h-6 w-6 fill-current" />
                </span>
              </button>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-marquee/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-marquee">
                {movie.industry.replace("_", " ")} Cinema
              </span>
              {movie.certification && (
                <span className="rounded-md border border-white/20 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white">
                  {movie.certification}
                </span>
              )}
              {movie.release_date && (
                <span className="text-xs text-mist flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {movie.release_date}
                </span>
              )}
              {movie.runtime_minutes && (
                <span className="text-xs text-mist flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatRuntime(movie.runtime_minutes)}
                </span>
              )}
            </div>

            <h1 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
              {movie.title}
            </h1>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-xs text-mist font-medium mt-0.5">Original Title: {movie.original_title}</p>
            )}
            {movie.tagline && <p className="mt-1.5 italic text-mist-light text-sm sm:text-base">"{movie.tagline}"</p>}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {movie.genres.map((g) => (
                <Link
                  key={g.id}
                  to={`/movies?genre=${encodeURIComponent(g.name)}`}
                  className="rounded-full bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-mist-light transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            {/* Quick Ratings Row */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-xl bg-ink-900/90 border border-white/10 px-3 py-1.5 shadow-sm">
                <Sparkles className="h-4 w-4 text-marquee" />
                <span className="text-xs text-mist">FlickRate:</span>
                <span className="font-display font-black text-marquee text-sm">
                  {formatScore(movie.flickrate_score)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-ink-900/90 border border-white/10 px-3 py-1.5 shadow-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-xs text-mist">IMDb:</span>
                <span className="font-semibold text-white text-sm">
                  {formatScore(movie.imdb_rating)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-ink-900/90 border border-white/10 px-3 py-1.5 shadow-sm">
                <span>🍅</span>
                <span className="text-xs text-mist">Rotten Tomatoes:</span>
                <span className="font-semibold text-white text-sm">
                  {movie.rotten_tomatoes_rating !== null ? `${movie.rotten_tomatoes_rating}%` : "—"}
                </span>
              </div>
              {movie.metascore !== null && movie.metascore !== undefined && (
                <div className="flex items-center gap-1.5 rounded-xl bg-ink-900/90 border border-white/10 px-3 py-1.5 shadow-sm">
                  <span className="h-4 w-4 rounded-sm bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center">M</span>
                  <span className="text-xs text-mist">Metascore:</span>
                  <span className="font-semibold text-white text-sm">{movie.metascore}</span>
                </div>
              )}
            </div>

            {/* Core Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setTrailerOpen(true)}
                className="btn-primary"
              >
                <Play className="h-4 w-4 fill-current" /> Watch Trailer
              </button>

              <button
                onClick={handleWatchlistToggle}
                className="btn-secondary"
                disabled={!isAuthenticated}
                title={!isAuthenticated ? "Sign in to add to watchlist" : undefined}
              >
                {inWatchlist ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
                {inWatchlist ? "In Watchlist" : "Watchlist"}
              </button>

              <button
                onClick={handleWatchedToggle}
                className={`btn-secondary ${isWatched ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" : ""}`}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? "Sign in to mark as watched" : undefined}
              >
                <Eye className="h-4 w-4" />
                {isWatched ? "Watched" : "Mark Watched"}
              </button>

              <button onClick={handleShare} className="btn-secondary p-2.5" title="Share movie link">
                <Share2 className="h-4 w-4" />
              </button>

              <button onClick={() => setReportOpen(true)} className="btn-secondary p-2.5 text-mist-dark hover:text-mist" title="Report movie data error">
                <Flag className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Rail */}
        <div className="mt-10 border-b border-white/10 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 sm:gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as DetailTab)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                    isActive
                      ? "border-marquee text-marquee bg-marquee/5"
                      : "border-transparent text-mist hover:text-white hover:border-white/20"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT SECTIONS */}
        <div className="mt-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-10 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-3">Storyline</h2>
                <p className="max-w-3xl text-base leading-relaxed text-mist-light">
                  {movie.overview || "No overview synopsis currently documented for this title."}
                </p>
              </div>

              {/* Star Rating Widget */}
              <div className="card-surface p-6 max-w-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                      <Star className="h-5 w-5 text-marquee fill-marquee" /> Your Personal Rating
                    </h3>
                    <p className="mt-1 text-xs text-mist">
                      {isAuthenticated
                        ? "Select a star to submit your verified rating (1 to 10)"
                        : "Sign in to rate this film and boost your personalized recommendations"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-marquee font-bold">
                      {hoverRating !== null ? `${hoverRating}/10` : movie.user_rating ? `Your score: ${movie.user_rating}/10 ★` : "Unrated"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
                    const isSelected = movie.user_rating !== null && movie.user_rating !== undefined && star <= (movie.user_rating || 0);
                    const isHovered = hoverRating !== null && star <= hoverRating;
                    const active = isHovered || (!hoverRating && isSelected);

                    return (
                      <button
                        key={star}
                        type="button"
                        disabled={!isAuthenticated || isSubmittingRating}
                        onMouseEnter={() => isAuthenticated && setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => handleRate(star)}
                        aria-label={`Rate ${star} out of 10`}
                        className={`p-1.5 transition-transform hover:scale-125 disabled:cursor-not-allowed ${
                          active ? "text-marquee" : "text-mist-dark hover:text-mist"
                        }`}
                      >
                        <Star className={`h-6 w-6 sm:h-7 sm:w-7 ${active ? "fill-current" : ""}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Community Reviews Section Under Rating Widget */}
              <div className="card-surface p-6 max-w-4xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-marquee" /> Community Reviews & Ratings
                    </h3>
                    <p className="text-xs text-mist mt-0.5">
                      Audience impressions, discussion, and detailed critiques for {movie.title}.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("ratings")}
                    className="text-xs text-marquee hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>View verified rating breakdown</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isAuthenticated ? (
                  <ReviewForm movieId={movie.id} onSubmitted={() => { setReviewsKey((k) => k + 1); load(); }} />
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-xs sm:text-sm text-mist">
                      <Link to="/login" className="text-marquee font-semibold hover:underline">Sign in</Link> to post your review and rating.
                    </p>
                  </div>
                )}

                <ReviewList key={`overview-reviews-${reviewsKey}`} movieId={movie.id} />
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 card-surface p-6 max-w-4xl">
                <div>
                  <span className="text-xs uppercase font-bold text-mist tracking-wider">Director</span>
                  <p className="mt-1 font-medium text-white text-sm">
                    {movie.director ? (
                      <Link to={`/people/${encodeURIComponent(movie.director)}`} className="hover:text-marquee underline-offset-2 hover:underline">
                        {movie.director}
                      </Link>
                    ) : "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-mist tracking-wider">Origin Country</span>
                  <p className="mt-1 font-medium text-white text-sm">{movie.country || "Unknown"}</p>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-mist tracking-wider">Spoken Languages</span>
                  <p className="mt-1 font-medium text-white text-sm">
                    {movie.spoken_languages.join(", ") || movie.original_language || "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-mist tracking-wider">Awards</span>
                  <p className="mt-1 font-medium text-white text-sm line-clamp-2">
                    {movie.awards || "None officially recorded"}
                  </p>
                </div>
                {movie.budget ? (
                  <div>
                    <span className="text-xs uppercase font-bold text-mist tracking-wider">Budget</span>
                    <p className="mt-1 font-medium text-emerald-400 text-sm">
                      ${movie.budget.toLocaleString()}
                    </p>
                  </div>
                ) : null}
                {movie.revenue ? (
                  <div>
                    <span className="text-xs uppercase font-bold text-mist tracking-wider">Worldwide Box Office</span>
                    <p className="mt-1 font-medium text-emerald-400 text-sm">
                      ${movie.revenue.toLocaleString()}
                    </p>
                  </div>
                ) : null}
                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-xs uppercase font-bold text-mist tracking-wider">Production</span>
                    <p className="mt-1 font-medium text-white text-sm">
                      {movie.production_companies.slice(0, 3).join(" • ")}
                    </p>
                  </div>
                )}
              </div>

              {/* External Links */}
              {movie.external_links && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-mist uppercase tracking-wider">External Profiles:</span>
                  {movie.external_links.imdb && (
                    <a
                      href={movie.external_links.imdb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist-light hover:text-white"
                    >
                      <span>IMDb Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {movie.external_links.tmdb && (
                    <a
                      href={movie.external_links.tmdb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist-light hover:text-white"
                    >
                      <span>TMDB Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {movie.external_links.homepage && (
                    <a
                      href={movie.external_links.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist-light hover:text-white"
                    >
                      <span>Official Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAST & CREW */}
          {activeTab === "cast" && (
            <div className="space-y-10 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-marquee" /> Principal Cast
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {(movie.cast_details || []).length > 0 ? (
                    movie.cast_details!.map((member, idx) => (
                      <Link
                        key={idx}
                        to={`/people/${encodeURIComponent(member.name)}`}
                        className="group card-surface p-3 text-center transition-transform hover:-translate-y-1 block"
                      >
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-ink-800 mb-2.5">
                          <img
                            src={
                              member.profile_path
                                ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                                : FALLBACK_POSTER
                            }
                            alt={member.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_POSTER; }}
                          />
                        </div>
                        <p className="font-semibold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-marquee transition-colors">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-mist line-clamp-1 mt-0.5">
                          {member.character || "Cast"}
                        </p>
                      </Link>
                    ))
                  ) : (
                    (movie.cast || []).map((name, idx) => (
                      <Link
                        key={idx}
                        to={`/people/${encodeURIComponent(name)}`}
                        className="card-surface p-4 text-center hover:border-marquee/50 transition-colors"
                      >
                        <div className="h-12 w-12 rounded-full bg-marquee/20 text-marquee flex items-center justify-center font-bold text-sm mx-auto mb-2">
                          {name.slice(0, 2)}
                        </div>
                        <p className="font-medium text-white text-sm">{name}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Crew Details */}
              <div className="border-t border-white/5 pt-8">
                <h3 className="text-lg font-bold font-display text-white mb-4">Production Crew</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="card-surface p-4">
                    <span className="text-xs uppercase font-bold text-mist">Director</span>
                    <p className="mt-1 font-semibold text-white">
                      {movie.director ? (
                        <Link to={`/people/${encodeURIComponent(movie.director)}`} className="hover:text-marquee">
                          {movie.director}
                        </Link>
                      ) : "Unknown"}
                    </p>
                  </div>
                  {movie.writers && movie.writers.length > 0 && (
                    <div className="card-surface p-4">
                      <span className="text-xs uppercase font-bold text-mist">Writers & Screenplay</span>
                      <p className="mt-1 font-semibold text-white">{movie.writers.join(", ")}</p>
                    </div>
                  )}
                  {(movie.crew_details || []).map((crew, idx) => (
                    <div key={idx} className="card-surface p-4">
                      <span className="text-xs uppercase font-bold text-mist">{crew.job || crew.department}</span>
                      <p className="mt-1 font-semibold text-white">
                        <Link to={`/people/${encodeURIComponent(crew.name)}`} className="hover:text-marquee">
                          {crew.name}
                        </Link>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RATINGS & SCORING */}
          {activeTab === "ratings" && (
            <div className="space-y-8 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-marquee" /> Verified Multi-Source Ratings Comparison
                </h2>
                <p className="text-sm text-mist">
                  FlickRate never fabricates reviews or ratings. Each score represents an official signal retrieved from authorized data endpoints.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FlickRate Score */}
                <div className="card-surface border-marquee/40 bg-gradient-to-br from-ink-900 to-ink-800 p-6 shadow-glow">
                  <span className="text-xs font-bold uppercase tracking-wider text-marquee flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> FlickRate Consensus Score
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-black text-marquee">
                      {formatScore(movie.flickrate_score)}
                    </span>
                    <span className="text-sm text-mist">/ 10</span>
                  </div>
                  <p className="mt-2 text-xs text-mist-light">
                    Weighted Bayesian consensus combining verified IMDb, Rotten Tomatoes, and community reviews.
                  </p>
                </div>

                {/* IMDb Rating */}
                <div className="card-surface p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400" /> IMDb Audience Score
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold text-white">
                      {formatScore(movie.imdb_rating, 1, "Not available")}
                    </span>
                    {movie.imdb_rating !== null && <span className="text-sm text-mist">/ 10</span>}
                  </div>
                  <p className="mt-2 text-xs text-mist">
                    {movie.imdb_votes ? `Derived from ${movie.imdb_votes.toLocaleString()} audience submissions` : "Global audience rating"}
                  </p>
                </div>

                {/* Rotten Tomatoes */}
                <div className="card-surface p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <span>🍅</span> Rotten Tomatoes Tomatometer
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold text-white">
                      {movie.rotten_tomatoes_rating !== null ? `${movie.rotten_tomatoes_rating}%` : "Not available"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-mist">
                    Verified film critic consensus from Rotten Tomatoes.
                  </p>
                </div>

                {/* Metacritic Score */}
                <div className="card-surface p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-sm bg-emerald-500 text-[10px] font-bold text-black flex items-center justify-center">M</span>
                    Metacritic Metascore
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold text-white">
                      {movie.metascore !== null && movie.metascore !== undefined ? movie.metascore : "Not available"}
                    </span>
                    {movie.metascore !== null && movie.metascore !== undefined && <span className="text-sm text-mist">/ 100</span>}
                  </div>
                  <p className="mt-2 text-xs text-mist">
                    Weighted average of premier publication and newspaper critic scores.
                  </p>
                </div>
              </div>

              {/* Rating Distribution Breakdown */}
              <div className="card-surface p-6">
                <h3 className="font-display text-base font-bold text-white mb-2">
                  Community Rating Distribution ({totalRatingsCount} verified ratings)
                </h3>
                <div className="space-y-2 mt-4">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((star) => {
                    const count = Number(dist[String(star)]) || 0;
                    const pct = totalRatingsCount > 0 ? (count / totalRatingsCount) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-10 text-right font-mono text-mist">{star} ★</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-900">
                          <div
                            className="h-full rounded-full bg-marquee transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-mist-light">{count} ({Math.round(pct)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bayesian Formula Explainer */}
              <div className="rounded-xl border border-marquee/20 bg-marquee/5 p-5">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-marquee shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Transparent FlickRate Scoring Formula</h4>
                    <p className="mt-1 text-xs text-mist leading-relaxed">
                      FlickRate blends IMDb (35%), Rotten Tomatoes (25%), FlickRate community user ratings (25%), and log-scaled popularity (15%). When any provider signal is absent, weights are automatically renormalized across verified active inputs. Missing data is never treated as zero.
                    </p>
                  </div>
                </div>
              </div>

              {/* Community Reviews Section Under Ratings */}
              <div className="pt-8 border-t border-white/10 space-y-6">
                <div>
                  <h3 className="text-xl font-bold font-display text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-marquee" /> Community Reviews & Ratings Discussion
                  </h3>
                  <p className="text-sm text-mist">
                    Verified audience reviews and detailed critique from the FlickRate community.
                  </p>
                </div>

                {isAuthenticated ? (
                  <ReviewForm movieId={movie.id} onSubmitted={() => { setReviewsKey((k) => k + 1); load(); }} />
                ) : (
                  <div className="card-surface p-5 text-center border border-white/10">
                    <p className="text-sm text-mist">
                      <Link to="/login" className="text-marquee font-semibold hover:underline">Sign in</Link> to share your review, rating breakdown, and impressions.
                    </p>
                  </div>
                )}

                <ReviewList key={`ratings-tab-reviews-${reviewsKey}`} movieId={movie.id} />
              </div>
            </div>
          )}

          {/* TAB 4: CRITIC REVIEWS */}
          {activeTab === "critic_reviews" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-marquee" /> Professional Critic Reviews
                </h2>
                <p className="text-sm text-mist">
                  Aggregated review excerpts from authorized editorial and critic sources.
                </p>
              </div>

              {(movie.critic_reviews || []).length > 0 ? (
                <div className="space-y-4">
                  {movie.critic_reviews!.map((review, idx) => (
                    <div key={idx} className="card-surface p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-sm">{review.author}</span>
                          <span className="text-xs text-mist ml-2">• {review.publication}</span>
                        </div>
                        {review.date && <span className="text-xs text-mist">{review.date}</span>}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-mist-light italic">
                        "{review.content}"
                      </p>
                      {review.url && (
                        <div className="mt-3">
                          <a
                            href={review.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-marquee hover:underline"
                          >
                            <span>Read full original review</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No critic reviews available."
                  message="Verified professional review excerpts have not been syndicated for this title yet."
                />
              )}
            </div>
          )}

          {/* TAB 5: AUDIENCE REVIEWS */}
          {activeTab === "audience_reviews" && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2">
                  Community Audience Reviews
                </h2>
                <p className="text-sm text-mist">
                  Share your impressions and read verified reviews from fellow movie fans.
                </p>
              </div>

              {isAuthenticated ? (
                <ReviewForm movieId={movie.id} onSubmitted={() => { setReviewsKey((k) => k + 1); load(); }} />
              ) : (
                <div className="card-surface p-4 text-center">
                  <p className="text-sm text-mist">
                    <Link to="/login" className="text-marquee font-semibold hover:underline">Sign in</Link> to write an in-depth review with ratings and spoiler protection.
                  </p>
                </div>
              )}

              <ReviewList key={reviewsKey} movieId={movie.id} />
            </div>
          )}

          {/* TAB 6: TRAILERS & VIDEOS */}
          {activeTab === "videos" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2 flex items-center gap-2">
                  <Video className="h-5 w-5 text-marquee" /> Official Trailers, Teasers & Clips
                </h2>
                <p className="text-sm text-mist">
                  Official promotional videos sourced via verified studio and distributor channels.
                </p>
              </div>

              {(movie.videos || []).length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {movie.videos!.map((vid, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveVideoKey(vid.key)}
                      className="group card-surface overflow-hidden cursor-pointer transition-transform hover:-translate-y-1"
                    >
                      <div className="relative aspect-video w-full bg-ink-800">
                        <img
                          src={`https://img.youtube.com/vi/${vid.key}/hqdefault.jpg`}
                          alt={vid.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                          <span className="rounded-full bg-marquee p-3 text-ink-950 shadow-glow">
                            <Play className="h-5 w-5 fill-current" />
                          </span>
                        </div>
                        <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          {vid.type || "Video"}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-white text-sm line-clamp-1 group-hover:text-marquee transition-colors">
                          {vid.name}
                        </p>
                        <p className="text-xs text-mist mt-0.5 flex items-center justify-between">
                          <span>YouTube Official</span>
                          <span className="text-marquee text-[11px] font-semibold">Play Clip →</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : movie.trailer_youtube_key ? (
                <div className="card-surface p-6 max-w-md">
                  <p className="font-semibold text-white text-sm mb-3">Official YouTube Trailer</p>
                  <button onClick={() => setTrailerOpen(true)} className="btn-primary w-full justify-center">
                    <Play className="h-4 w-4 fill-current" /> Watch Main Trailer
                  </button>
                </div>
              ) : (
                <EmptyState
                  title="No official trailers currently available."
                  message="Video metadata has not been syndicated for this title."
                />
              )}
            </div>
          )}

          {/* TAB 7: MORE LIKE THIS */}
          {activeTab === "similar" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold font-display text-white mb-2 flex items-center gap-2">
                  <Film className="h-5 w-5 text-marquee" /> Because You Liked {movie.title}
                </h2>
                <p className="text-sm text-mist">
                  AI content recommendations matched via synopsis vectors, shared directors, cast networks, and emotional mood tones.
                </p>
              </div>

              {similar === null ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)}
                </div>
              ) : similar.length === 0 ? (
                <EmptyState
                  title="No similar titles found yet."
                  message="Seed additional movies to expand the recommendation graph."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {similar.map((rec) => (
                    <RecommendationCard key={rec.movie.id} rec={rec} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Official Trailer Modal */}
      <TrailerModal movieId={movie.id} open={trailerOpen} onClose={() => setTrailerOpen(false)} />

      {/* Embedded Specific Video Modal */}
      {activeVideoKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-ink-950 p-2 ring-1 ring-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-semibold text-mist uppercase tracking-wider">Video Player</span>
              <button
                onClick={() => setActiveVideoKey(null)}
                className="rounded-full p-1 text-mist hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoKey}?autoplay=1&rel=0`}
                title="Movie Video"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-2 text-right p-2">
              <a
                href={`https://www.youtube.com/watch?v=${activeVideoKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-mist hover:text-white inline-flex items-center gap-1"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="card-surface w-full max-w-md p-6 relative">
            <button onClick={() => setShareOpen(false)} className="absolute right-4 top-4 text-mist hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="h-5 w-5 text-marquee" /> Share {movie.title}
            </h3>
            <p className="mt-1 text-xs text-mist">
              Copy the direct URL or share with friends on social discovery platforms.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                readOnly
                value={window.location.href}
                className="input-field text-xs select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast("Link copied to clipboard!");
                }}
                className="btn-primary shrink-0 text-xs"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="card-surface w-full max-w-md p-6 relative">
            <button onClick={() => setReportOpen(false)} className="absolute right-4 top-4 text-mist hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-marquee" /> Report Movie Metadata Issue
            </h3>
            <p className="mt-1 text-xs text-mist">
              Reporting issue for <span className="text-white font-medium">{movie.title}</span>
            </p>

            {reportSent ? (
              <p className="mt-4 text-sm text-marquee font-medium">
                Thank you! Our catalog team will verify this movie's data.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-mist uppercase mb-1">Issue type</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="incorrect_metadata">Incorrect release date or runtime</option>
                    <option value="broken_trailer">Broken or incorrect trailer embed</option>
                    <option value="cast_missing">Missing actor or crew credits</option>
                    <option value="poster_issue">Incorrect poster or backdrop</option>
                    <option value="other">Other issue</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setReportOpen(false)} className="btn-secondary text-xs">Cancel</button>
                  <button
                    onClick={() => {
                      setReportSent(true);
                      setTimeout(() => {
                        setReportOpen(false);
                        setReportSent(false);
                      }, 2000);
                    }}
                    className="btn-primary text-xs"
                  >
                    Submit Issue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
