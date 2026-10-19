import { Link } from "react-router-dom";
import { Film, Github } from "lucide-react";

const LINKS = [
  { to: "/movies", label: "Movies" },
  { to: "/trending", label: "Trending" },
  { to: "/genres", label: "Genres" },
  { to: "/recommendations", label: "Recommendations" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-950 px-4 py-12 sm:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
            <Film className="h-5 w-5 text-marquee" />
            FLICK<span className="text-marquee">RATE</span>
          </Link>
          <p className="mt-2 max-w-xs text-sm text-mist">Discover. Rate. Watch.</p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-2">
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm text-mist hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <a href="#" className="text-sm text-mist hover:text-white">About</a>
            <a href="#" className="text-sm text-mist hover:text-white">Privacy</a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-white"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[1600px] text-xs text-mist/70">© 2026 FlickRate</p>
    </footer>
  );
}
