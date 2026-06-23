export function StoreSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[14px] bg-ink-900 p-6">
          <div className="h-[220px] rounded-[10px] bg-ink-800" />
          <div className="mt-4 h-5 w-24 rounded bg-ink-800" />
          <div className="mt-4 h-12 rounded-[14px] bg-ink-800" />
          <div className="mt-5 space-y-3">
            <div className="h-4 rounded bg-ink-800" />
            <div className="h-4 w-5/6 rounded bg-ink-800" />
            <div className="h-4 w-4/6 rounded bg-ink-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
