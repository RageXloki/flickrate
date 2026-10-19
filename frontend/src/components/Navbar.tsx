import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, Mic, User as UserIcon, Bookmark, LogOut, Film, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchMovies } from "@/services/movieService";
import type { SearchResponse } from "@/services/movieService";
import { FALLBACK_POSTER } from "@/utils/format";

const NAV_LINKS = [
  { to: "/movies", label: "Movies" },
  { to: "/top-rated", label: "Top Rated" },
  { to: "/upcoming", label: "Upcoming" },
  { to: "/regional", label: "Regional" },
  { to: "/bollywood", label: "Bollywood" },
  { to: "/hollywood", label: "Hollywood" },
  { to: "/lists", label: "Lists" },
  { to: "/moods", label: "Moods" },
  { to: "/recommendations", label: "AI Match" },
  { to: "/assistant", label: "AI Search" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const debouncedQuery = useDebouncedValue(query, 300);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    searchMovies(debouncedQuery).then((data) => {
      if (!cancelled) setResults(data);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const { state: voiceState, start: startVoice } = useVoiceSearch((transcript) => {
    setQuery(transcript);
  });

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setResults(null);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-ink-950/90 backdrop-blur-md border-b border-white/5" : "bg-gradient-to-b from-ink-950/80 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-white">
            <Film className="h-6 w-6 text-marquee" />
            FLICK<span className="text-marquee">RATE</span>
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            <Link to="/" className="text-sm font-medium text-mist hover:text-white">Home</Link>
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-medium text-mist hover:text-white">
                {link.label}
              </Link>
            ))}
            {user?.is_staff && (
              <Link
                to="/admin-dashboard"
                className="flex items-center gap-1.5 rounded-full border border-marquee/30 bg-marquee/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-marquee hover:bg-marquee/20"
              >
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            {searchOpen ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-3 py-1.5">
                <Search className="h-4 w-4 text-mist" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                  placeholder="Search movies, actors, directors..."
                  className="w-64 bg-transparent text-sm text-white placeholder:text-mist focus:outline-none"
                />
                <button
                  onClick={startVoice}
                  aria-label="Voice search"
                  className={`rounded-full p-1 ${voiceState === "listening" ? "animate-pulse-ring text-marquee" : "text-mist hover:text-white"}`}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button onClick={() => { setSearchOpen(false); setQuery(""); setResults(null); }} aria-label="Close search">
                  <X className="h-4 w-4 text-mist hover:text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} aria-label="Open search" className="btn-ghost">
                <Search className="h-5 w-5" />
              </button>
            )}

            {searchOpen && results && (results.local_results.length > 0 || results.tmdb_suggestions.length > 0) && (
              <div className="absolute right-0 mt-2 max-h-96 w-96 overflow-y-auto rounded-xl border border-white/10 bg-ink-800 shadow-card">
                {results.local_results.map((m) => (
                  <Link
                    key={m.id}
                    to={`/movies/${m.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5"
                  >
                    <img src={m.poster_url || FALLBACK_POSTER} alt="" className="h-12 w-8 rounded object-cover" />
                    <div>
                      <p className="text-sm text-white">{m.title}</p>
                      <p className="text-xs text-mist">{m.year}</p>
                    </div>
                  </Link>
                ))}
                <div className="border-t border-white/10 p-2 text-center">
                  <button
                    onClick={submitSearch}
                    className="text-xs font-semibold text-marquee hover:underline"
                  >
                    View all matching results for "{query}" &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Link to="/watchlist" className="btn-ghost" aria-label="Watchlist">
                <Bookmark className="h-5 w-5" />
              </Link>
              <Link to="/profile" className="btn-ghost" aria-label="Profile">
                <UserIcon className="h-5 w-5" />
                <span className="hidden lg:inline">{user?.username}</span>
              </Link>
              <button onClick={() => logout()} className="btn-ghost" aria-label="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden sm:inline-flex">Login</Link>
          )}

          <button className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-white/5 bg-ink-950 px-4 py-4 lg:hidden">
          <div className="mb-3 flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-3 py-2">
            <Search className="h-4 w-4 text-mist" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Search movies..."
              className="w-full bg-transparent text-sm text-white placeholder:text-mist focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-mist hover:text-white">Home</Link>
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="text-mist hover:text-white">
                {link.label}
              </Link>
            ))}
            {user?.is_staff && (
              <Link to="/admin-dashboard" onClick={() => setMobileOpen(false)} className="text-marquee font-semibold flex items-center gap-1">
                <Shield className="h-4 w-4" /> Admin Console
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link to="/watchlist" onClick={() => setMobileOpen(false)} className="text-mist hover:text-white">Watchlist</Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-mist hover:text-white">Profile</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-left text-mist hover:text-white">Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-marquee font-semibold">Login</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
