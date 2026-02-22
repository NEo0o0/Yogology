'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Calendar, Clock, DollarSign, MapPin, ArrowRight, Loader2, CheckCircle, Camera } from 'lucide-react';
import { EventDetailModal } from '@/components/bookings/EventDetailModal';
import { PastEventModal } from '@/components/bookings/PastEventModal';
import { GalleryManagementModal } from '@/components/admin/GalleryManagementModal';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkshops } from '@/hooks';
import { toast } from 'sonner';
import { formatToThaiTime, formatToThaiDateLong } from '@/utils/dateHelpers';
import type { Tables, TablesInsert } from '@/types/database.types';

type Workshop = Tables<'classes'>;

// Fallback image for workshops without cover images
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80';

// Helper functions for formatting (using Thailand timezone)
const formatDate = (startsAt: string, endsAt: string | null): string => {
  const startDate = new Date(startsAt);
  const endDate = endsAt ? new Date(endsAt) : null;
  
  if (endDate && endsAt && startDate.toDateString() !== endDate.toDateString()) {
    // Multi-day event
    const startStr = formatToThaiDateLong(startsAt).replace(/, \d{4}$/, ''); // Remove year from start
    const endStr = formatToThaiDateLong(endsAt);
    return `${startStr} - ${endStr}`;
  }
  
  return formatToThaiDateLong(startsAt);
};

const formatTime = (startsAt: string, endsAt: string | null): string => {
  const startTime = formatToThaiTime(startsAt);
  
  if (endsAt) {
    const endTime = formatToThaiTime(endsAt);
    return `${startTime} - ${endTime}`;
  }
  
  return startTime;
};

const formatPrice = (price: number | null): string => {
  if (!price || price === 0) return 'Free';
  return `฿${price.toLocaleString()}`;
};

const truncateText = (text: string | null, maxLength: number = 150): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const formatEvent = (workshop: Workshop) => {
  return {
    id: workshop.id,
    title: workshop.title,
    image: workshop.cover_image_url || FALLBACK_IMAGE,
    starts_at: workshop.starts_at,
    date: formatDate(workshop.starts_at, workshop.ends_at),
    time: formatTime(workshop.starts_at, workshop.ends_at),
    price: formatPrice(workshop.price),
    location: workshop.location || 'TBA',
    excerpt: workshop.description || '',
    long_description: workshop.long_description,
    category: workshop.category || 'Workshop',
    gallery_images: workshop.gallery_images,
    early_bird_price: workshop.early_bird_price,
    early_bird_deadline: workshop.early_bird_deadline
  };
};

export function WorkshopsEvents({ initialWorkshops }: { initialWorkshops?: Workshop[] }) {
  const router = useRouter();
  const { workshops, loading, error, refetch } = useWorkshops({ initialWorkshops });
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<ReturnType<typeof formatEvent> | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Workshop | null>(null);

  const isAdmin = profile?.role === 'admin';

  // Split workshops into upcoming and past based on starts_at
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming = workshops.filter(w => new Date(w.starts_at) >= now);
    const past = workshops.filter(w => new Date(w.starts_at) < now);
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [workshops]);

  const events = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);

    try {
      const payload: TablesInsert<'newsletter_subscribers'> = { email: newsletterEmail };
      const { error: insertError } = await (supabase
        .from('newsletter_subscribers') as unknown as {
        insert: (values: TablesInsert<'newsletter_subscribers'>) => Promise<{ error: any }>;
      }).insert(payload);

      if (insertError) {
        // Handle duplicate email (Postgres error code 23505)
        if (insertError.code === '23505') {
          toast.info('This email is already subscribed to our newsletter!');
          setNewsletterEmail('');
          return;
        }
        throw insertError;
      }

      toast.success('Successfully subscribed to our newsletter! 🎉');
      setNewsletterEmail('');
      setSubscribeSuccess(true);
      
      // Reset success state after 5 seconds
      setTimeout(() => setSubscribeSuccess(false), 5000);
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <section className="py-20 px-6 bg-[var(--color-cream)] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="mb-4 text-[var(--color-earth-dark)]">Workshops & Events</h1>
          <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
            Join us for transformative workshops, special events, and retreats designed to deepen your practice and connect with community.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-8 py-3 rounded-lg transition-all duration-300 ${
                activeTab === 'upcoming'
                  ? 'bg-[var(--color-sage)] text-white shadow-lg'
                  : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-8 py-3 rounded-lg transition-all duration-300 ${
                activeTab === 'past'
                  ? 'bg-[var(--color-sage)] text-white shadow-lg'
                  : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Past Events
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-[var(--color-sage)] animate-spin mb-4" />
            <p className="text-[var(--color-stone)]">Loading workshops...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto">
            <p className="text-red-800">Failed to load workshops. Please try again later.</p>
          </div>
        )}

        {/* Events List */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Event Cover Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={event.cover_image_url || FALLBACK_IMAGE}
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                  {/* Admin Edit Gallery Button */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGallery(event);
                      }}
                      className="absolute top-4 left-4 p-2 bg-white/95 hover:bg-white backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
                      title="Edit Gallery"
                    >
                      <Camera size={18} className="text-[var(--color-sage)] group-hover:text-[var(--color-clay)]" />
                    </button>
                  )}
                  {/* Category Badge */}
                  {event.category && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-block px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs text-[var(--color-earth-dark)] shadow-lg">
                        {event.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Event Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Title */}
                  <h3 className="mb-3 text-[var(--color-earth-dark)] line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Date & Time */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-[var(--color-clay)] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[var(--color-stone)]">
                        {formatDate(event.starts_at, event.ends_at)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={16} className="text-[var(--color-clay)] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[var(--color-stone)]">
                        {formatTime(event.starts_at, event.ends_at)}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-[var(--color-clay)] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[var(--color-stone)]">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  <p className="text-sm text-[var(--color-stone)] mb-4 line-clamp-3 flex-1">
                    {truncateText(event.description, 150)}
                  </p>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-sand)] mt-auto">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-[var(--color-clay)]" />
                      {(() => {
                        const currentDate = new Date();
                        const earlyBirdDeadline = event.early_bird_deadline ? new Date(event.early_bird_deadline) : null;
                        const isEarlyBirdValid = earlyBirdDeadline && currentDate <= earlyBirdDeadline && event.early_bird_price;
                        
                        if (isEarlyBirdValid) {
                          return (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-red-600">
                                  {formatPrice(event.early_bird_price)}
                                </span>
                                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-semibold rounded-full">EARLY BIRD</span>
                              </div>
                              <span className="text-sm text-[var(--color-stone)] line-through">
                                {formatPrice(event.price)}
                              </span>
                            </div>
                          );
                        }
                        
                        return (
                          <span className="text-xl text-[var(--color-earth-dark)]">
                            {formatPrice(event.price)}
                          </span>
                        );
                      })()}
                    </div>
                    <button
                      className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm group"
                      onClick={() => setSelectedEvent(formatEvent(event))}
                    >
                      {new Date(event.starts_at) < new Date() ? 'View Details' : 'Register'}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for No Events */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[var(--color-stone)] text-lg">
              No {activeTab} events at this time. Check back soon!
            </p>
          </div>
        )}

        {/* Newsletter Signup */}
        {activeTab === 'upcoming' && (
          <div className="mt-16 bg-white rounded-lg p-8 text-center shadow-lg">
            <h3 className="mb-3 text-[var(--color-earth-dark)]">Stay Updated</h3>
            <p className="text-[var(--color-stone)] mb-6">
              Subscribe to our newsletter to be the first to know about new workshops and special events.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={isSubscribing}
                required
              />
              <button
                type="submit"
                className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
            {subscribeSuccess && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[var(--color-sage)]">
                <CheckCircle size={20} />
                <span>Successfully subscribed!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && activeTab === 'upcoming' && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onNavigate={(page) => {
            if (page === 'login') {
              router.push('/login');
              return;
            }
            if (page === 'contact') {
              router.push('/contact');
              return;
            }
            if (page === 'home') {
              router.push('/');
              return;
            }
          }}
        />
      )}

      {/* Past Event Modal */}
      {selectedEvent && activeTab === 'past' && (
        <PastEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Gallery Management Modal (Admin Only) */}
      {editingGallery && (
        <GalleryManagementModal
          workshopId={editingGallery.id}
          workshopTitle={editingGallery.title}
          currentGalleryImages={editingGallery.gallery_images}
          currentCoverImage={editingGallery.cover_image_url}
          onClose={() => setEditingGallery(null)}
          onSuccess={() => {
            refetch();
            setEditingGallery(null);
          }}
        />
      )}
    </section>
  );
}