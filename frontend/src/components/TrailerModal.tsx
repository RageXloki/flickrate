import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchTrailer } from "@/services/movieService";

interface TrailerModalProps {
  movieId: number;
  open: boolean;
  onClose: () => void;
}

function toEmbedUrl(watchUrl: string): string {
  const key = watchUrl.split("v=")[1];
  return `https://www.youtube.com/embed/${key}?autoplay=1`;
}

export function TrailerModal({ movieId, open, onClose }: TrailerModalProps) {
  const [status, setStatus] = useState<"loading" | "available" | "unavailable">("loading");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus("loading");
    fetchTrailer(movieId).then((data) => {
      if (data.available && data.url) {
        setEmbedUrl(toEmbedUrl(data.url));
        setStatus("available");
      } else {
        setStatus("unavailable");
      }
    });
  }, [open, movieId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trailer player"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close trailer"
          className="absolute -top-10 right-0 rounded-full p-2 text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink-800">
          {status === "loading" && <div className="skeleton h-full w-full rounded-xl" />}
          {status === "available" && embedUrl && (
            <iframe
              src={embedUrl}
              title="Official Trailer"
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
          {status === "unavailable" && (
            <div className="flex h-full w-full items-center justify-center text-mist">Trailer unavailable</div>
          )}
        </div>
      </div>
    </div>
  );
}
