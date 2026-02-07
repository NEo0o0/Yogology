import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { Tables } from '@/types/database.types';

type Workshop = Tables<'classes'>;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80';

function formatDate(startsAt: string, endsAt: string | null): string {
  const startDate = new Date(startsAt);
  const endDate = endsAt ? new Date(endsAt) : null;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  if (endDate && startDate.toDateString() !== endDate.toDateString()) {
    const startStr = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  return startDate.toLocaleDateString('en-US', options);
}

function formatTime(startsAt: string, endsAt: string | null): string {
  const startDate = new Date(startsAt);
  const endDate = endsAt ? new Date(endsAt) : null;

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const startTime = startDate.toLocaleTimeString('en-US', timeOptions);

  if (endDate) {
    const endTime = endDate.toLocaleTimeString('en-US', timeOptions);
    return `${startTime} - ${endTime}`;
  }

  return startTime;
}

function formatPrice(price: number | null): string {
  if (!price || price === 0) return 'Free';
  return `฿${price.toLocaleString()}`;
}

function truncateText(text: string | null, maxLength = 150): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
}

export async function UpcomingWorkshopsSection() {
  const supabase = await createSupabaseServerClient();

  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from('classes')
    .select('*')
    .in('category', ['Workshop', 'Retreat', 'Special Event'])
    .eq('is_cancelled', false)
    .gt('starts_at', nowIso)
    .order('starts_at', { ascending: true })
    .limit(3)
    .returns<Workshop[]>();

  const workshops = data ?? [];

  return (
    <section className="py-20 px-6 bg-[var(--color-cream)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-[var(--color-earth-dark)]">Upcoming Workshops</h2>
          <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
            Join us for transformative workshops and special events designed to deepen your practice.
          </p>
        </div>

        {workshops.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[var(--color-stone)]">No upcoming workshops right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={event.cover_image_url || FALLBACK_IMAGE}
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                  {event.category && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-block px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs text-[var(--color-earth-dark)] shadow-lg">
                        {event.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="mb-3 text-[var(--color-earth-dark)] line-clamp-2">{event.title}</h3>

                  <div className="space-y-2 mb-3">
                    <div className="text-sm text-[var(--color-stone)]">{formatDate(event.starts_at, event.ends_at)}</div>
                    <div className="text-sm text-[var(--color-stone)]">{formatTime(event.starts_at, event.ends_at)}</div>
                    {event.location && (
                      <div className="text-sm text-[var(--color-stone)]">{event.location}</div>
                    )}
                  </div>

                  <p className="text-sm text-[var(--color-stone)] mb-4 line-clamp-3 flex-1">
                    {truncateText(event.description, 150)}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-sand)] mt-auto">
                    <span className="text-xl text-[var(--color-earth-dark)]">{formatPrice(event.price)}</span>
                    <a
                      href="/workshops"
                      className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm"
                    >
                      View All
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <a
            href="/workshops"
            className="inline-flex items-center justify-center bg-white text-[var(--color-earth-dark)] px-8 py-4 rounded-full hover:bg-[var(--color-sand)] transition-all duration-300 shadow-lg"
          >
            Explore Workshops
          </a>
        </div>
      </div>
    </section>
  );
}
