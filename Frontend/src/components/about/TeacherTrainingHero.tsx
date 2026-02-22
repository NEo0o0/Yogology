 "use client";

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import { useTeacherTraining } from '@/hooks/useTeacherTraining';
import { useAuth } from '@/hooks/useAuth';
import { TrainingDetailModal } from '@/components/bookings/TrainingDetailModal';
import type { Tables } from '@/types/database.types';

type Training = Tables<'classes'> & {
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  registration_opens_at: string | null;
};

type TrainingStatus = 'Coming Soon' | 'Early Bird' | 'Regular' | 'Closed';

export function TeacherTrainingHero({ upcomingTraining }: { upcomingTraining: Training | null }) {
  const router = useRouter();
  const { user } = useAuth();
  const training = upcomingTraining;
  const [showDetail, setShowDetail] = useState(false);

  const now = Date.now();

  const registrationOpensAt = useMemo(() => {
    const raw = training?.registration_opens_at;
    return raw ? new Date(raw) : null;
  }, [training]);

  const earlyBirdDeadline = useMemo(() => {
    const raw = training?.early_bird_deadline;
    return raw ? new Date(raw) : null;
  }, [training]);

  const earlyBirdPrice = useMemo(() => {
    const raw = training?.early_bird_price;
    return raw ?? null;
  }, [training]);

  const trainingStartsAt = useMemo(() => {
    if (!training?.starts_at) return null;
    return new Date(training.starts_at);
  }, [training?.starts_at]);

  const status = useMemo<TrainingStatus>(() => {
    if (!trainingStartsAt || !training) return 'Coming Soon';

    const nowDate = new Date(now);

    const isClosedByCapacity = training.booked_count >= training.capacity;
    const isClosedByTime = nowDate >= trainingStartsAt;
    if (isClosedByCapacity || isClosedByTime) return 'Closed';

    if (registrationOpensAt && nowDate < registrationOpensAt) return 'Coming Soon';

    if (earlyBirdDeadline && nowDate <= earlyBirdDeadline) return 'Early Bird';

    return 'Regular';
  }, [earlyBirdDeadline, now, registrationOpensAt, training, trainingStartsAt]);

  const formattedDate = useMemo(() => {
    if (!training?.starts_at) return '';
    const start = new Date(training.starts_at);
    const end = training.ends_at ? new Date(training.ends_at) : start;
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    
    if (sameMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()} (Sundays off)`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()} (Sundays off)`;
  }, [training?.starts_at, training?.ends_at]);

  const formattedRegistrationOpensAt = useMemo(() => {
    if (!registrationOpensAt) return '';
    return registrationOpensAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [registrationOpensAt]);

  const formattedEarlyBirdDeadline = useMemo(() => {
    if (!earlyBirdDeadline) return '';
    return earlyBirdDeadline.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [earlyBirdDeadline]);

  const excerpt = useMemo(() => {
    const text = training?.description ?? '';
    if (text.length <= 160) return text;
    return `${text.slice(0, 160).trim()}...`;
  }, [training?.description]);

  const regularPriceLabel = useMemo(() => {
    const price = training?.price;
    if (!price || price === 0) return 'Free';
    return `฿${price.toLocaleString()}`;
  }, [training?.price]);

  const earlyBirdPriceLabel = useMemo(() => {
    if (!earlyBirdPrice || earlyBirdPrice === 0) return 'Free';
    return `฿${earlyBirdPrice.toLocaleString()}`;
  }, [earlyBirdPrice]);

  const earlyBirdSavingsLabel = useMemo(() => {
    const regular = training?.price;
    if (!regular || !earlyBirdPrice) return '';
    const diff = regular - earlyBirdPrice;
    if (diff <= 0) return '';
    return `฿${diff.toLocaleString()}`;
  }, [earlyBirdPrice, training?.price]);

  const badgeLabel = useMemo(() => {
    if (status === 'Early Bird') return '🔥 Early Bird';
    if (status === 'Coming Soon') return 'Coming Soon';
    if (status === 'Regular') return 'Enrolling Now';
    return 'Closed';
  }, [status]);

  const cta = useMemo(() => {
    if (!training) {
      return { disabled: true, text: 'Apply Now' };
    }

    if (status === 'Closed') {
      return { disabled: true, text: 'Registration Closed' };
    }

    if (status === 'Coming Soon') {
      if (formattedRegistrationOpensAt) {
        return { disabled: true, text: `Opens on ${formattedRegistrationOpensAt}` };
      }
      return { disabled: true, text: 'Coming Soon' };
    }

    if (status === 'Early Bird') {
      if (earlyBirdSavingsLabel) {
        return { disabled: false, text: `Apply Now (Save ${earlyBirdSavingsLabel})` };
      }
      return { disabled: false, text: 'Apply Now (Early Bird)' };
    }

    return { disabled: false, text: 'Apply Now' };
  }, [earlyBirdSavingsLabel, formattedRegistrationOpensAt, status, training]);

  // Dynamic hero image: use training's cover_image_url if available, otherwise default
  const heroImage = training?.cover_image_url || "/images/ttc/TTC Hero.png";

  const handleApplyNow = () => {
    if (!training) return;

    if (cta.disabled) return;

    if (!user) {
      router.push('/login');
      return;
    }

    setShowDetail(true);
  };

  return (
    <section className="relative h-[98vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Yoga teacher training group"
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <span className="text-sm tracking-wide uppercase">Transform Your Practice</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-white">{training?.title || 'Teacher Training'}</h1>
            <span className="inline-block px-3 py-1 rounded-full text-xs bg-white/20 backdrop-blur-sm">
              {badgeLabel}
            </span>
          </div>

          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            {excerpt || 'Our next teacher training is coming soon. Check back for details.'}
          </p>

          {training && (
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                {status === 'Early Bird' && earlyBirdPrice != null ? (
                  <span>
                    <span className="font-semibold">Early Bird: {earlyBirdPriceLabel}</span>{' '}
                    <span className="opacity-80 line-through">{regularPriceLabel}</span>
                  </span>
                ) : status === 'Coming Soon' && earlyBirdPrice != null ? (
                  <span>Starting from {earlyBirdPriceLabel}</span>
                ) : (
                  <span>{regularPriceLabel}</span>
                )}
              </div>
            </div>
          )}

          {status === 'Early Bird' && formattedEarlyBirdDeadline && (
            <p className="text-sm mb-6 opacity-95">Early Bird ends on {formattedEarlyBirdDeadline}!</p>
          )}

          <div className="flex items-center justify-center">
            <button
              onClick={handleApplyNow}
              disabled={cta.disabled}
              className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-10 py-4 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              {cta.text}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/60 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
        </div>
      </div>

      {showDetail && training && (
        <TrainingDetailModal
          training={training as Training}
          onClose={() => setShowDetail(false)}
        />
      )}
    </section>
  );
}
