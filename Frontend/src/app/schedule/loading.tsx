export default function ScheduleLoading() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-56 bg-[var(--color-sand)] rounded-md mb-8 animate-pulse" />

        <div className="flex items-center justify-between mb-8">
          <div className="h-10 w-28 bg-[var(--color-cream)] rounded-lg animate-pulse" />
          <div className="h-10 w-64 bg-[var(--color-cream)] rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-[var(--color-cream)] rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[var(--color-cream)] rounded-lg border border-[var(--color-sand)] overflow-hidden"
            >
              <div className="h-12 bg-white/60 animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="h-4 w-3/4 bg-white/70 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-white/70 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-white/70 rounded animate-pulse" />
                <div className="h-9 w-full bg-white/70 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
