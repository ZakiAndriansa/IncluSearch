export function ExpertCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="skeleton w-14 h-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 flex gap-1.5">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="px-4 pb-4 pt-3 border-t border-sand-100 flex items-center justify-between">
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}
