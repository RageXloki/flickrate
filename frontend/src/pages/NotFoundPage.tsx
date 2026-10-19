import { Link } from "react-router-dom";
import { Film } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Film className="h-12 w-12 text-marquee" />
      <h1 className="font-display text-3xl font-bold text-white">Page not found.</h1>
      <p className="text-mist">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
