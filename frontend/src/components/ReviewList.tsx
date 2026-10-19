import { useEffect, useState } from "react";
import { ThumbsUp, Star, Trash2, Flag, Eye, EyeOff, AlertTriangle, X } from "lucide-react";
import { fetchMovieReviews, markReviewHelpful, deleteReview } from "@/services/interactionService";
import { reportReview } from "@/services/movieService";
import { useAuth } from "@/context/AuthContext";
import { ReviewSkeleton } from "./Skeletons";
import { EmptyState } from "./States";
import type { Review } from "@/types";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  oldest: "Oldest",
  highest_rated: "Highest Rated",
  lowest_rated: "Lowest Rated",
  most_helpful: "Most Helpful",
};

export function ReviewList({ movieId }: { movieId: number }) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest" | "highest_rated" | "lowest_rated" | "most_helpful">("newest");
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  // Report modal state
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("spoiler");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const load = () => {
    fetchMovieReviews(movieId, sort).then(setReviews).catch(() => setReviews([]));
  };

  useEffect(load, [movieId, sort]);

  const handleHelpful = async (reviewId: number) => {
    if (!isAuthenticated) return;
    const result = await markReviewHelpful(reviewId).catch(() => null);
    if (!result) return;
    setReviews((prev) => prev?.map((r) => (r.id === reviewId ? { ...r, helpful_count: result.helpful_count } : r)) ?? null);
  };

  const handleDelete = async (reviewId: number) => {
    await deleteReview(reviewId).catch(() => {});
    load();
  };

  const toggleSpoiler = (reviewId: number) => {
    setRevealedSpoilers((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;
    setReportSubmitting(true);
    try {
      await reportReview(reportingReview.id, reportReason, reportDetails);
      setReportSuccess("Report submitted for moderation review. Thank you!");
      setTimeout(() => {
        setReportingReview(null);
        setReportSuccess(null);
        setReportDetails("");
      }, 2000);
    } catch {
      setReportSuccess("Unable to submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-mist">
          Showing {reviews ? reviews.length : 0} community review{reviews && reviews.length === 1 ? "" : "s"}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-mist mr-1">Sort:</span>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSort(value as any)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sort === value ? "bg-marquee text-ink-950 font-semibold" : "text-mist hover:text-white bg-ink-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {reviews === null ? (
        <div>{Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)}</div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet." message="Be the first to share your thoughts on this movie." />
      ) : (
        <ul className="divide-y divide-white/5 space-y-2">
          {reviews.map((review) => {
            const isSpoilerHidden = review.is_spoiler && !revealedSpoilers[review.id];

            return (
              <li key={review.id} className="py-4 card-surface px-5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-marquee/20 text-marquee flex items-center justify-center font-bold text-xs uppercase">
                      {review.username.slice(0, 2)}
                    </div>
                    <div>
                      <span className="font-medium text-sm text-white">{review.username}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-marquee">
                          <Star className="h-3 w-3 fill-marquee" /> {review.rating}/10
                        </span>
                        <span className="text-[11px] text-mist">{new Date(review.created_at).toLocaleDateString()}</span>
                        {review.is_spoiler && (
                          <span className="rounded bg-rose-500/20 text-rose-300 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> Spoiler
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {review.is_mine ? (
                      <button
                        aria-label="Delete review"
                        onClick={() => handleDelete(review.id)}
                        className="text-mist hover:text-red-400 p-1"
                        title="Delete your review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      isAuthenticated && (
                        <button
                          onClick={() => setReportingReview(review)}
                          className="text-mist-dark hover:text-mist p-1 text-xs flex items-center gap-1"
                          title="Report inappropriate content or spoilers"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {review.title && <p className="mt-3 font-semibold text-white text-base">{review.title}</p>}

                {/* Spoiler-protected review body */}
                {review.body && (
                  <div className="mt-2">
                    {isSpoilerHidden ? (
                      <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-center">
                        <p className="text-xs text-rose-300 font-medium flex items-center justify-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          This review contains spoilers for this movie.
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleSpoiler(review.id)}
                          className="mt-2 inline-flex items-center gap-1 rounded bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-200 hover:bg-rose-500/30 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> Reveal Review
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm leading-relaxed text-mist-light">{review.body}</p>
                        {review.is_spoiler && (
                          <button
                            type="button"
                            onClick={() => toggleSpoiler(review.id)}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-mist hover:text-white"
                          >
                            <EyeOff className="h-3 w-3" /> Hide spoiler content
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                  <button
                    onClick={() => handleHelpful(review.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-mist hover:text-marquee transition-colors"
                    title={!isAuthenticated ? "Log in to vote" : undefined}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>Helpful</span>
                    <span className="rounded-full bg-white/5 px-1.5 py-0.2 font-mono text-[11px]">
                      {review.helpful_count}
                    </span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Report Review Modal */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="card-surface w-full max-w-md p-6 relative">
            <button
              onClick={() => setReportingReview(null)}
              className="absolute right-4 top-4 text-mist hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-marquee" /> Report Review
            </h3>
            <p className="mt-1 text-xs text-mist">
              Reporting review by <span className="text-white font-medium">{reportingReview.username}</span>
            </p>

            {reportSuccess ? (
              <p className="mt-4 text-sm text-marquee font-medium">{reportSuccess}</p>
            ) : (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-mist uppercase mb-1.5">
                    Reason for report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="input-field"
                  >
                    <option value="spoiler">Unmarked plot spoiler</option>
                    <option value="spam">Spam or promotional content</option>
                    <option value="inappropriate">Inappropriate, abusive, or hate speech</option>
                    <option value="off_topic">Irrelevant or fake review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-mist uppercase mb-1.5">
                    Details (optional)
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={3}
                    placeholder="Provide additional context for moderation..."
                    className="input-field resize-none text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingReview(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="btn-primary text-xs"
                  >
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
