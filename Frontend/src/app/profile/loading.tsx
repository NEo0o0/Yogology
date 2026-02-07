export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--color-cream)] via-white to-[var(--color-sand)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 animate-pulse">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-sand)]" />
              <div>
                <div className="h-6 w-48 bg-[var(--color-sand)] rounded mb-2" />
                <div className="h-4 w-64 bg-[var(--color-sand)] rounded" />
              </div>
            </div>
            <div className="h-10 w-28 bg-[var(--color-sand)] rounded-lg" />
          </div>

          <div className="mt-8">
            <div className="h-10 w-72 bg-[var(--color-sand)] rounded-lg mb-6" />
            <div className="space-y-4">
              <div className="h-24 bg-[var(--color-cream)] rounded-xl" />
              <div className="h-24 bg-[var(--color-cream)] rounded-xl" />
              <div className="h-24 bg-[var(--color-cream)] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
