import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserCircle, Star, Bookmark, Heart, Eye, ListFilter,
  Settings, Trash2, Plus, Film, Check, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchWatchlist, fetchWatchedMovies, fetchCustomLists } from "@/services/interactionService";
import { MovieCard } from "@/components/MovieCard";
import { EmptyState } from "@/components/States";
import { api } from "@/services/apiClient";
import type { WatchlistEntry, WatchedMovieEntry, CustomList } from "@/types";

const ALL_GENRES = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Thriller", "Animation", "Adventure", "Crime", "Mystery"];

type ProfileTab = "watchlist" | "watched" | "lists" | "settings";

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProfileTab>("watchlist");
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [watched, setWatched] = useState<WatchedMovieEntry[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form
  const [bio, setBio] = useState(user?.bio || "");
  const [savingBio, setSavingBio] = useState(false);
  const [savingGenres, setSavingGenres] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWatchlist().catch(() => []),
      fetchWatchedMovies().catch(() => []),
      fetchCustomLists().catch(() => []),
    ]).then(([wl, wm, cl]) => {
      setWatchlist(wl);
      setWatched(wm);
      setCustomLists(cl.filter((l) => l.is_owner));
      setLoading(false);
    });
  }, []);

  const toggleGenre = async (genre: string) => {
    if (!user) return;
    const current = user.favorite_genres || [];
    const next = current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre];
    setSavingGenres(true);
    try {
      await api.patch("/auth/me/", { favorite_genres: next });
      await refreshUser();
    } finally {
      setSavingGenres(false);
    }
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBio(true);
    try {
      await api.patch("/auth/me/", { bio });
      await refreshUser();
      setStatusMsg("Profile updated successfully!");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg("Failed to update profile.");
    } finally {
      setSavingBio(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete your account and all associated reviews, ratings, and lists? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete("/auth/me/");
      logout();
      navigate("/");
    } catch {
      alert("Unable to delete account.");
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 space-y-10">
      {/* Profile Header Banner */}
      <div className="card-surface p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-ink-800 text-marquee flex items-center justify-center font-bold text-3xl font-display shrink-0 border border-white/10 shadow-card">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover rounded-2xl" />
          ) : (
            user.username.slice(0, 2).toUpperCase()
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="rounded-full bg-marquee/15 px-3 py-0.5 text-xs font-bold text-marquee uppercase tracking-wider">
              {user.is_staff ? "Staff Member" : "Film Enthusiast"}
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">{user.username}</h1>
          <p className="text-xs text-mist mt-0.5">{user.email}</p>
          {user.bio ? (
            <p className="mt-2 text-sm text-mist-light max-w-2xl">{user.bio}</p>
          ) : (
            <p className="mt-1 text-xs text-mist italic">No bio written yet.</p>
          )}
          <p className="mt-3 text-[11px] text-mist">
            Member since {new Date(user.date_joined).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setActiveTab("watchlist")}
          className={`card-surface p-4 text-left border transition-all ${
            activeTab === "watchlist" ? "border-marquee shadow-glow" : "border-white/5"
          }`}
        >
          <div className="flex items-center justify-between text-mist mb-1">
            <span className="text-xs uppercase font-bold tracking-wider">Watchlist</span>
            <Bookmark className="h-4 w-4 text-marquee" />
          </div>
          <p className="font-display text-2xl font-bold text-white">{watchlist.length}</p>
          <p className="text-[11px] text-mist">Saved to watch</p>
        </button>

        <button
          onClick={() => setActiveTab("watched")}
          className={`card-surface p-4 text-left border transition-all ${
            activeTab === "watched" ? "border-marquee shadow-glow" : "border-white/5"
          }`}
        >
          <div className="flex items-center justify-between text-mist mb-1">
            <span className="text-xs uppercase font-bold tracking-wider">Watched</span>
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-display text-2xl font-bold text-white">{watched.length}</p>
          <p className="text-[11px] text-mist">Films logged</p>
        </button>

        <button
          onClick={() => setActiveTab("lists")}
          className={`card-surface p-4 text-left border transition-all ${
            activeTab === "lists" ? "border-marquee shadow-glow" : "border-white/5"
          }`}
        >
          <div className="flex items-center justify-between text-mist mb-1">
            <span className="text-xs uppercase font-bold tracking-wider">Custom Lists</span>
            <ListFilter className="h-4 w-4 text-marquee" />
          </div>
          <p className="font-display text-2xl font-bold text-white">{customLists.length}</p>
          <p className="text-[11px] text-mist">Collections created</p>
        </button>

        <Link
          to="/recommendations"
          className="card-surface p-4 text-left border border-white/5 hover:border-marquee/40 transition-all block"
        >
          <div className="flex items-center justify-between text-mist mb-1">
            <span className="text-xs uppercase font-bold tracking-wider">AI Matches</span>
            <Sparkles className="h-4 w-4 text-marquee" />
          </div>
          <p className="font-display text-2xl font-bold text-marquee">Ready</p>
          <p className="text-[11px] text-mist">Personalized picks</p>
        </Link>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {[
          { key: "watchlist", label: `Watchlist (${watchlist.length})`, icon: Bookmark },
          { key: "watched", label: `Watched History (${watched.length})`, icon: Eye },
          { key: "lists", label: `My Collections (${customLists.length})`, icon: ListFilter },
          { key: "settings", label: "Preferences & Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ProfileTab)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-marquee text-ink-950 shadow-glow"
                  : "text-mist hover:text-white bg-white/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WATCHLIST */}
      {activeTab === "watchlist" && (
        <div className="space-y-4">
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {watchlist.map((item) => (
                <MovieCard key={item.id} movie={item.movie} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your watchlist is currently empty."
              message="Explore trending and top-rated cinema to save films for later."
              action={
                <Link to="/movies" className="btn-primary mt-2">
                  <Film className="h-4 w-4" /> Browse Movies
                </Link>
              }
            />
          )}
        </div>
      )}

      {/* TAB 2: WATCHED HISTORY */}
      {activeTab === "watched" && (
        <div className="space-y-4">
          {watched.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {watched.map((item) => (
                <div key={item.id} className="space-y-1">
                  <MovieCard movie={item.movie} />
                  <p className="text-[10px] text-mist text-center">Watched: {item.watched_date}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No movies marked as watched yet."
              message="Mark films as watched from any movie detail page to build your viewing history."
              action={
                <Link to="/movies" className="btn-primary mt-2">
                  <Film className="h-4 w-4" /> Explore Movies
                </Link>
              }
            />
          )}
        </div>
      )}

      {/* TAB 3: CUSTOM LISTS */}
      {activeTab === "lists" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-lg font-bold text-white">Your Curated Collections</h2>
            <Link to="/lists" className="btn-primary text-xs">
              <Plus className="h-4 w-4" /> Create New List
            </Link>
          </div>

          {customLists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {customLists.map((l) => (
                <Link
                  key={l.id}
                  to={`/lists/${l.id}`}
                  className="card-surface p-5 rounded-2xl border border-white/5 hover:border-marquee/40 transition-all block group"
                >
                  <span className="text-xs text-marquee font-bold">
                    {l.item_count} film{l.item_count === 1 ? "" : "s"}
                  </span>
                  <h3 className="font-bold text-white text-base mt-1 group-hover:text-marquee transition-colors">
                    {l.title}
                  </h3>
                  <p className="text-xs text-mist mt-1 line-clamp-2">{l.description || "No description."}</p>
                  <p className="text-[11px] text-mist-dark mt-3">Updated {new Date(l.updated_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="You haven't created any custom lists yet."
              message="Curate thematic lists and share them with the FlickRate community."
              action={
                <Link to="/lists" className="btn-primary mt-2">
                  <Plus className="h-4 w-4" /> Go to Lists Hub
                </Link>
              }
            />
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & PREFERENCES */}
      {activeTab === "settings" && (
        <div className="space-y-10 max-w-2xl">
          {statusMsg && (
            <div className="rounded-xl bg-marquee/20 border border-marquee/30 p-3 text-xs text-marquee font-semibold">
              {statusMsg}
            </div>
          )}

          {/* Bio Form */}
          <form onSubmit={handleSaveBio} className="card-surface p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-display text-base font-bold text-white">Personal Bio</h3>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other movie lovers about your cinema taste..."
              className="input-field text-xs resize-none"
            />
            <button type="submit" disabled={savingBio} className="btn-primary text-xs">
              {savingBio ? "Saving..." : "Save Bio"}
            </button>
          </form>

          {/* Favorite Genres Tuning */}
          <div className="card-surface p-6 rounded-2xl border border-white/5">
            <h3 className="font-display text-base font-bold text-white mb-1">Favorite Genres</h3>
            <p className="text-xs text-mist mb-4">
              Toggle your preferred genres to bias AI recommendations toward your favorite themes.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((genre) => {
                const active = user.favorite_genres?.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    disabled={savingGenres}
                    onClick={() => toggleGenre(genre)}
                    className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-marquee bg-marquee text-ink-950 shadow-glow"
                        : "border-white/10 bg-white/5 text-mist hover:text-white"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Deletion / Privacy Section */}
          <div className="card-surface p-6 rounded-2xl border border-red-500/20 bg-red-950/10">
            <h3 className="font-display text-base font-bold text-red-300 flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Account Data & Deletion
            </h3>
            <p className="mt-1 text-xs text-mist leading-relaxed">
              In accordance with privacy standards, you can permanently erase your user account, watchlist, ratings, reviews, and all associated personal data from FlickRate.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
            >
              Permanently Delete My Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
