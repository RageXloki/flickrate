import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert, Users, Film, Star, MessageSquare, Bookmark,
  Trash2, RefreshCw, Eye, TrendingUp, Search
} from "lucide-react";
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminReviews,
  deleteAdminReview,
  syncMovieAdmin
} from "@/services/movieService";
import type { AdminStats, AdminUser, AdminReview } from "@/types";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [activeTab, setActiveTab] = useState<"analytics" | "reviews" | "users">("analytics");
  const [loading, setLoading] = useState(true);

  // Sync movie state
  const [syncTmdbId, setSyncTmdbId] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, r] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminReviews(),
      ]);
      setStats(s);
      setUsers(u);
      setReviews(r);
    } catch (err) {
      console.error("Failed to load admin telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this review?")) return;
    try {
      await deleteAdminReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      // Refresh stats
      fetchAdminStats().then(setStats).catch(() => {});
    } catch {
      alert("Failed to delete review.");
    }
  };

  const handleSyncMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncTmdbId.trim()) return;
    setSyncLoading(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const res = await syncMovieAdmin(Number(syncTmdbId));
      setSyncMessage(res.detail);
      setSyncTmdbId("");
      fetchAdminStats().then(setStats).catch(() => {});
    } catch (err: any) {
      setSyncError(err.response?.data?.detail || "Failed to sync movie. Check TMDB ID and server key.");
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
      {/* Admin Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-marquee">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Staff Operations</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Admin & Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-mist">
            Platform performance telemetry, content moderation, and real-time catalog management.
          </p>
        </div>
        <button onClick={loadAll} className="btn-secondary self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" /> Refresh Telemetry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">Users</span>
            <Users className="h-5 w-5 text-marquee" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white">
            {stats?.metrics.total_users ?? "—"}
          </p>
          <p className="mt-1 text-xs text-mist">Registered accounts</p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">Movies</span>
            <Film className="h-5 w-5 text-marquee" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white">
            {stats?.metrics.total_movies ?? "—"}
          </p>
          <p className="mt-1 text-xs text-mist">Catalog titles</p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">Reviews</span>
            <MessageSquare className="h-5 w-5 text-marquee" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white">
            {stats?.metrics.total_reviews ?? "—"}
          </p>
          <p className="mt-1 text-xs text-mist">Published reviews</p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">Ratings</span>
            <Star className="h-5 w-5 text-marquee" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white">
            {stats?.metrics.total_ratings ?? "—"}
          </p>
          <p className="mt-1 text-xs text-mist">Submitted ratings</p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">Watchlists</span>
            <Bookmark className="h-5 w-5 text-marquee" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white">
            {stats?.metrics.total_watchlist ?? "—"}
          </p>
          <p className="mt-1 text-xs text-mist">Saved to watchlists</p>
        </div>
      </div>

      {/* Live TMDB Ingest Tool */}
      <div className="card-surface mb-10 p-6">
        <h2 className="font-display text-lg font-bold text-white">Live Movie Ingest & Sync</h2>
        <p className="mt-1 text-xs text-mist">
          Import any movie directly from TMDB into the FlickRate catalog by TMDB ID (e.g. 550 for Fight Club, 603 for The Matrix).
        </p>
        <form onSubmit={handleSyncMovie} className="mt-4 flex flex-wrap gap-3">
          <input
            type="number"
            value={syncTmdbId}
            onChange={(e) => setSyncTmdbId(e.target.value)}
            placeholder="Enter TMDB Movie ID..."
            className="input-field max-w-xs"
          />
          <button type="submit" disabled={syncLoading} className="btn-primary">
            {syncLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
            {syncLoading ? "Ingesting..." : "Sync to Database"}
          </button>
        </form>
        {syncMessage && (
          <p className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400">
            {syncMessage}
          </p>
        )}
        {syncError && (
          <p className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            {syncError}
          </p>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "analytics"
              ? "bg-marquee text-ink-950"
              : "text-mist hover:text-white"
          }`}
        >
          Analytics & Insights
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "reviews"
              ? "bg-marquee text-ink-950"
              : "text-mist hover:text-white"
          }`}
        >
          Review Moderation ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "users"
              ? "bg-marquee text-ink-950"
              : "text-mist hover:text-white"
          }`}
        >
          User Accounts ({users.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === "analytics" && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Most Viewed Movies */}
            <div className="card-surface p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <Eye className="h-5 w-5 text-marquee" /> Most Viewed Movies
              </h3>
              <div className="mt-4 divide-y divide-white/5">
                {(stats.most_viewed || []).map((m, idx) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-mist">#{idx + 1}</span>
                      <div>
                        <Link to={`/movies/${m.id}`} className="text-sm font-semibold text-white hover:text-marquee">
                          {m.title}
                        </Link>
                        <p className="text-xs text-mist">{m.year} • {m.industry}</p>
                      </div>
                    </div>
                    <span className="rounded bg-white/5 px-2.5 py-1 text-xs font-semibold text-marquee">
                      Score: {m.flickrate_score ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Rated Movies */}
            <div className="card-surface p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <TrendingUp className="h-5 w-5 text-marquee" /> Most Rated Titles
              </h3>
              <div className="mt-4 divide-y divide-white/5">
                {(stats.most_rated || []).map((m, idx) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-mist">#{idx + 1}</span>
                      <div>
                        <Link to={`/movies/${m.id}`} className="text-sm font-semibold text-white hover:text-marquee">
                          {m.title}
                        </Link>
                        <p className="text-xs text-mist">{m.year} • {m.industry}</p>
                      </div>
                    </div>
                    <span className="rounded bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
                      ★ {m.imdb_rating ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Industry Distribution */}
            <div className="card-surface p-6">
              <h3 className="font-display text-lg font-bold text-white">Industry Breakdown</h3>
              <div className="mt-4 space-y-3">
                {Object.entries(stats.industry_distribution || {}).map(([ind, count]) => {
                  const total = stats.metrics.total_movies || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={ind}>
                      <div className="flex justify-between text-xs text-mist-light">
                        <span className="capitalize">{ind.replace("_", " ")}</span>
                        <span>{count} films ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-900">
                        <div
                          className="h-full bg-marquee transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Genres */}
            <div className="card-surface p-6">
              <h3 className="font-display text-lg font-bold text-white">Genre Volume</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(stats.genre_distribution || []).map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-xl bg-ink-900/60 p-3">
                    <span className="text-sm font-medium text-white">{g.name}</span>
                    <span className="rounded-full bg-marquee/20 px-2 py-0.5 text-xs font-bold text-marquee">
                      {g.movie_count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Searches Telemetry */}
          {(stats.recent_searches || []).length > 0 && (
            <div className="card-surface p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <Search className="h-5 w-5 text-marquee" /> Recent User Search Inquiries
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(stats.recent_searches || []).map((s, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-900 px-3 py-1.5 text-xs text-mist-light"
                  >
                    <span>"{s.query}"</span>
                    <span className="text-mist">({s.results_count} results)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVIEW MODERATION */}
      {activeTab === "reviews" && (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-mist-light">
              <thead className="border-b border-white/10 bg-ink-900/80 text-xs uppercase tracking-wider text-mist">
                <tr>
                  <th className="p-4">Movie</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Review Content</th>
                  <th className="p-4">Helpful</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-mist">
                      No user reviews submitted yet.
                    </td>
                  </tr>
                ) : (
                  reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-white/5">
                      <td className="p-4 font-semibold text-white">
                        <Link to={`/movies/${rev.movie_id}`} className="hover:text-marquee">
                          {rev.movie_title}
                        </Link>
                      </td>
                      <td className="p-4 text-mist">{rev.username}</td>
                      <td className="p-4 font-bold text-marquee">★ {rev.rating}/10</td>
                      <td className="p-4 max-w-xs truncate">
                        <p className="font-medium text-white">{rev.title || "—"}</p>
                        <p className="text-xs text-mist line-clamp-1">{rev.body}</p>
                      </td>
                      <td className="p-4">{rev.helpful_count}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER ROSTER */}
      {activeTab === "users" && (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-mist-light">
              <thead className="border-b border-white/10 bg-ink-900/80 text-xs uppercase tracking-wider text-mist">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Reviews</th>
                  <th className="p-4">Watchlist</th>
                  <th className="p-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="p-4 font-semibold text-white">{u.username}</td>
                    <td className="p-4 text-mist">{u.email}</td>
                    <td className="p-4">
                      {u.is_staff ? (
                        <span className="rounded bg-marquee/20 px-2 py-0.5 text-xs font-bold text-marquee">
                          Staff Admin
                        </span>
                      ) : (
                        <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-mist">
                          Member
                        </span>
                      )}
                    </td>
                    <td className="p-4">{u.reviews_count}</td>
                    <td className="p-4">{u.watchlist_count}</td>
                    <td className="p-4 text-xs text-mist">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
