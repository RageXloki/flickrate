import { useState } from "react";
import { Star } from "lucide-react";
import { createReview } from "@/services/interactionService";

interface ReviewFormProps {
  movieId: number;
  onSubmitted: () => void;
}

export function ReviewForm({ movieId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (rating === 0) {
      setError("Please choose a rating before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createReview(movieId, rating, title, body, isSpoiler);
      setRating(0);
      setTitle("");
      setBody("");
      setIsSpoiler(false);
      onSubmitted();
    } catch (err: any) {
      setError(err?.response?.data?.movie?.[0] || err?.response?.data?.detail || "Unable to submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-surface mb-6 space-y-3 p-4">
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${value} out of 10`}
              className="p-0.5"
            >
              <Star
                className={`h-5 w-5 ${
                  (hoverRating || rating) >= value ? "fill-marquee text-marquee" : "text-ink-600"
                }`}
              />
            </button>
          );
        })}
        <span className="ml-2 text-sm text-mist">{rating > 0 ? `${rating}/10` : "Rate this movie"}</span>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        className="input-field"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
        className="input-field resize-none"
      />
      <label className="flex items-center gap-2 text-xs text-mist cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isSpoiler}
          onChange={(e) => setIsSpoiler(e.target.checked)}
          className="rounded border-white/20 bg-ink-800 text-marquee focus:ring-marquee"
        />
        <span>This review contains major plot spoilers</span>
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={submit} disabled={submitting} className="btn-primary disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
