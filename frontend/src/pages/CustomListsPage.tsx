import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListFilter, Plus, Lock, Globe, Film, Sparkles, X } from "lucide-react";
import { fetchCustomLists, createCustomList } from "@/services/interactionService";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/States";
import type { CustomList } from "@/types";

export function CustomListsPage() {
  const { isAuthenticated, user } = useAuth();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchCustomLists()
      .then((res) => {
        setLists(res);
        setLoading(false);
      })
      .catch(() => {
        setLists([]);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("List title is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createCustomList(title, description, isPrivate);
      setTitle("");
      setDescription("");
      setIsPrivate(false);
      setModalOpen(false);
      load();
    } catch {
      setError("Unable to create list. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-marquee mb-1">
            <ListFilter className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Curation Hub</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            Community Movie Lists
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-mist max-w-2xl">
            Explore thematic movie collections, marathons, and personal favorites curated by cinema fans and editors.
          </p>
        </div>

        {isAuthenticated && (
          <button onClick={() => setModalOpen(true)} className="btn-primary self-start sm:self-auto">
            <Plus className="h-4 w-4" /> Create Custom List
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-surface p-6 h-48 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : lists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {lists.map((l) => (
            <Link
              key={l.id}
              to={`/lists/${l.id}`}
              className="card-surface p-6 rounded-2xl border border-white/5 hover:border-marquee/40 transition-all hover:-translate-y-1 block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-mist font-medium flex items-center gap-1">
                  {l.is_private ? (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Lock className="h-3 w-3" /> Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-mist">
                      <Globe className="h-3 w-3" /> Public List
                    </span>
                  )}
                </span>
                <span className="rounded-full bg-marquee/15 px-2.5 py-0.5 text-xs font-bold text-marquee">
                  {l.item_count} film{l.item_count === 1 ? "" : "s"}
                </span>
              </div>

              <h3 className="font-display text-lg font-bold text-white group-hover:text-marquee transition-colors">
                {l.title}
              </h3>

              <p className="mt-2 text-xs text-mist line-clamp-2 leading-relaxed">
                {l.description || "No description provided for this collection."}
              </p>

              <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between text-xs text-mist">
                <span>By <span className="text-white font-medium">{l.username}</span></span>
                <span className="text-marquee font-semibold group-hover:translate-x-1 transition-transform">
                  View List →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No custom movie lists yet."
          message="Create the very first collection to share your favorite films."
          action={
            isAuthenticated ? (
              <button onClick={() => setModalOpen(true)} className="btn-primary mt-2">
                <Plus className="h-4 w-4" /> Create List
              </button>
            ) : (
              <Link to="/login" className="btn-primary mt-2">
                Sign in to Create Lists
              </Link>
            )
          }
        />
      )}

      {/* Create List Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="card-surface w-full max-w-md p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-mist hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-marquee" /> Create Custom Movie List
            </h3>
            <p className="mt-1 text-xs text-mist">
              Create a collection to organize your favorite cinema marathons, directors, or genres.
            </p>

            {error && <p className="mt-3 text-xs text-red-400 font-medium">{error}</p>}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-mist uppercase mb-1">
                  List Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 90s Psychological Thrillers"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-mist uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What makes this collection unique?..."
                  className="input-field resize-none text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-mist cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-white/20 bg-ink-800 text-marquee focus:ring-marquee"
                />
                <span>Make this list private (only visible to you)</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? "Creating..." : "Save List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
