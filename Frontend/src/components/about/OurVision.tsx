import { Quote } from 'lucide-react';

export function OurVision() {
  return (
    <section className="py-20 px-6 bg-[var(--color-sage)]/10 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-sand)]/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-terracotta)]/20 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Quote Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-sand)] mb-8">
          <Quote size={32} className="text-[var(--color-clay)]" strokeWidth={1.5} />
        </div>

        <h2 className="mb-8 text-[var(--color-earth-dark)]">Our Vision</h2>
        
        {/* Main Quote */}
        <blockquote className="mb-8">
          <p className="text-2xl md:text-3xl italic text-[var(--color-earth-dark)] mb-6" style={{ fontWeight: 300, lineHeight: 1.6 }}>
            "Yoga is not about touching your toes. It's about what you learn on the way down."
          </p>
        </blockquote>

        {/* Philosophy Text */}
        <div className="space-y-6 text-[var(--color-stone)] max-w-3xl mx-auto">
          <p>
            At Annie Bliss Yoga, we envision a world where everyone has access to the transformative practice of yoga—regardless of age, body type, flexibility, or experience level.
          </p>
          <p>
            Our teaching philosophy centers on authenticity, compassion, and mindful awareness. We believe that yoga is a personal journey of self-discovery, not a performance or competition. Each breath, each movement, each moment of stillness is an opportunity to connect more deeply with yourself.
          </p>
          <p>
            We're committed to creating an inclusive sanctuary where you can explore your practice safely, honor your body's wisdom, and cultivate inner peace that extends far beyond the mat into every aspect of your daily life.
          </p>
        </div>

        {/* Signature Element */}
        <div className="mt-12 pt-8 border-t border-[var(--color-sand)]">
          <p className="text-[var(--color-clay)] italic">~ Annie Bliss</p>
        </div>
      </div>
    </section>
  );
}
