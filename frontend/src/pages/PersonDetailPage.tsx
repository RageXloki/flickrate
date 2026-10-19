import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { User, Film, Clapperboard, Award, ChevronLeft } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { CardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/States";
import { fetchPersonDetail } from "@/services/movieService";
import type { PersonDetail } from "@/types";

export function PersonDetailPage() {
  const { name } = useParams<{ name: string }>();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetchPersonDetail(name)
      .then((data) => {
        setPerson(data);
        setLoading(false);
      })
      .catch(() => {
        setPerson(null);
        setLoading(false);
      });
  }, [name]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-8">
        <div className="h-8 w-48 bg-ink-800 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!person || person.total_credits === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <EmptyState
          title={`No films found for ${name}.`}
          message="This artist may not yet have catalogued film credits in the database."
          action={
            <Link to="/movies" className="btn-primary mt-4">
              <ChevronLeft className="h-4 w-4" /> Back to Movies
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-8 space-y-12">
      {/* Back button */}
      <div>
        <Link to="/movies" className="inline-flex items-center gap-1.5 text-xs text-mist hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Movies
        </Link>
      </div>

      {/* Artist Profile Header */}
      <div className="card-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 max-w-4xl border border-white/10">
        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl overflow-hidden bg-ink-800 shrink-0 border border-white/10 shadow-card flex items-center justify-center">
          {person.profile_image ? (
            <img
              src={person.profile_image}
              alt={person.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-marquee/20 text-marquee font-bold text-3xl font-display">
              {person.name.slice(0, 2)}
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
            {person.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-marquee/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-marquee"
              >
                {role}
              </span>
            ))}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            {person.name}
          </h1>

          <p className="mt-2 text-xs text-mist">
            Catalogued across <span className="font-bold text-white">{person.total_credits}</span> production{person.total_credits === 1 ? "" : "s"} on FlickRate.
          </p>
        </div>
      </div>

      {/* Directed Works Shelf */}
      {person.directing_credits.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-marquee" />
            <h2 className="font-display text-xl font-bold text-white">
              Directed Films ({person.directing_credits.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {person.directing_credits.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}

      {/* Acting Works Shelf */}
      {person.acting_credits.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Film className="h-5 w-5 text-marquee" />
            <h2 className="font-display text-xl font-bold text-white">
              Acting Roles ({person.acting_credits.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {person.acting_credits.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
