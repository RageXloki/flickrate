import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ListFilter, ChevronLeft, Lock, Globe, Trash2, Plus, Film } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { CardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/States";
import { fetchCustomList, deleteCustomList, removeMovieFromCustomList } from "@/services/interactionService";
import { useAuth } from "@/context/AuthContext";
import type { CustomList } from "@/types";

export function CustomListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [list, setList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    setLoading(true);
    fetchCustomList(Number(id))
      .then((res) => {
        setList(res);
        setLoading(false);
      })
      .catch(() => {
        setList(null);
        setLoading(false);
      });
  };

  useEffect(load, [id]);

  const handleDeleteList = async () => {
    if (!list) return;
    if (!window.confirm(`Are you sure you want to delete "${list.title}"?`)) return;
    try {
      await deleteCustomList(list.id);
      navigate("/lists");
    } catch {
      alert("Unable to delete list.");
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!list) return;
    try {
      await removeMovieFromCustomList(list.id, movieId);
      load();
    } catch {
      alert("Unable to remove movie.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
        <div className="h-8 w-64 bg-ink-800 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <EmptyState
          title="Custom list not found."
          message="This movie list may have been deleted or is set to private."
          action={
            <Link to="/lists" className="btn-primary mt-4">
              <ChevronLeft className="h-4 w-4" /> Back to Lists
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 space-y-8">
      <div>
        <Link to="/lists" className="inline-flex items-center gap-1.5 text-xs text-mist hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Lists
        </Link>
      </div>

      {/* List Header */}
      <div className="card-surface p-6 sm:p-8 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {list.is_private ? (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                <Lock className="h-3 w-3" /> Private List
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-mist font-semibold bg-white/5 px-2.5 py-0.5 rounded-full">
                <Globe className="h-3 w-3" /> Public List
              </span>
            )}
            <span className="text-xs text-mist font-medium">
              Curated by <span className="text-white font-semibold">{list.username}</span>
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            {list.title}
          </h1>

          {list.description && (
            <p className="mt-2 text-sm text-mist-light max-w-3xl leading-relaxed">
              {list.description}
            </p>
          )}

          <p className="mt-4 text-xs text-marquee font-bold">
            {list.items.length} film{list.items.length === 1 ? "" : "s"} collected
          </p>
        </div>

        {list.is_owner && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleDeleteList}
              className="btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/10 text-xs"
            >
              <Trash2 className="h-4 w-4" /> Delete Collection
            </button>
          </div>
        )}
      </div>

      {/* Movies in List */}
      {list.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {list.items.map((item) => (
            <div key={item.id} className="relative group">
              <MovieCard movie={item.movie} />
              {list.is_owner && (
                <button
                  type="button"
                  onClick={() => handleRemoveMovie(item.movie.id)}
                  aria-label="Remove movie from list"
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-mist hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  title="Remove from list"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="This list is empty."
          message="Browse the catalog and add movies to this collection."
          action={
            <Link to="/movies" className="btn-primary mt-2">
              <Film className="h-4 w-4" /> Browse Movies
            </Link>
          }
        />
      )}
    </div>
  );
}
