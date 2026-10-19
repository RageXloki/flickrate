export function MovieCardSkeleton() {
  return (
    <div className="w-[168px] shrink-0 sm:w-[190px]">
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="mt-2 space-y-1.5">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}

export const CardSkeleton = MovieCardSkeleton;

export function CardRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="skeleton h-[60vh] min-h-[420px] w-full rounded-none" />
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="skeleton mb-6 h-72 w-full rounded-2xl" />
      <div className="flex gap-6">
        <div className="skeleton h-72 w-48 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="space-y-2 border-b border-white/5 py-4">
      <div className="skeleton h-4 w-1/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-3/4" />
    </div>
  );
}
