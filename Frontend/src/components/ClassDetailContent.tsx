import { Clock, Users, Calendar, Target } from 'lucide-react';

export function ClassDetailContent() {
  return (
    <section className="py-16 px-6 bg-white mb-24">
      <div className="max-w-4xl mx-auto">
        {/* Title and Level */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="text-[var(--color-earth-dark)]">Vinyasa Flow</h1>
            <span className="inline-block px-4 py-2 rounded-full bg-[var(--color-terracotta)]/30 text-[var(--color-clay)]">
              Intermediate
            </span>
          </div>
          <p className="text-[var(--color-stone)] text-lg">
            A dynamic, flowing style of yoga that synchronizes breath with movement
          </p>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 p-6 bg-[var(--color-cream)] rounded-lg">
          <div className="flex flex-col items-center text-center">
            <Clock size={24} className="text-[var(--color-clay)] mb-2" />
            <span className="text-sm text-[var(--color-stone)]">Duration</span>
            <span className="text-[var(--color-earth-dark)]">75 min</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Users size={24} className="text-[var(--color-clay)] mb-2" />
            <span className="text-sm text-[var(--color-stone)]">Class Size</span>
            <span className="text-[var(--color-earth-dark)]">Max 20</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Calendar size={24} className="text-[var(--color-clay)] mb-2" />
            <span className="text-sm text-[var(--color-stone)]">Frequency</span>
            <span className="text-[var(--color-earth-dark)]">3x/week</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Target size={24} className="text-[var(--color-clay)] mb-2" />
            <span className="text-sm text-[var(--color-stone)]">Focus</span>
            <span className="text-[var(--color-earth-dark)]">Flow & Strength</span>
          </div>
        </div>

        {/* About the Class */}
        <div className="mb-12">
          <h2 className="mb-6 text-[var(--color-earth-dark)]">About This Class</h2>
          <div className="space-y-4 text-[var(--color-stone)]">
            <p>
              Vinyasa Flow is a dynamic and energizing yoga practice that links breath with movement in a continuous, flowing sequence. Each posture seamlessly transitions into the next, creating a moving meditation that builds heat, strength, and flexibility while calming the mind.
            </p>
            <p>
              In this intermediate-level class, you'll explore creative sequencing that challenges your balance, core strength, and mental focus. The practice incorporates sun salutations, standing poses, balancing postures, and gentle inversions, all woven together with conscious breathing.
            </p>
          </div>
        </div>

        {/* Class Benefits */}
        <div className="mb-12">
          <h2 className="mb-6 text-[var(--color-earth-dark)]">Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Builds cardiovascular endurance and stamina',
              'Increases muscular strength and flexibility',
              'Improves balance and coordination',
              'Enhances mental clarity and focus',
              'Reduces stress and anxiety',
              'Cultivates mindful awareness',
              'Tones and sculpts the entire body',
              'Improves breath control and lung capacity',
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-sage)] mt-2 flex-shrink-0" />
                <p className="text-[var(--color-stone)]">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to Bring */}
        <div className="mb-12">
          <h2 className="mb-6 text-[var(--color-earth-dark)]">What to Bring</h2>
          <div className="bg-[var(--color-sage)]/10 p-6 rounded-lg">
            <ul className="space-y-3 text-[var(--color-stone)]">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-clay)]" />
                Yoga mat (or use one of our complimentary studio mats)
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-clay)]" />
                Water bottle to stay hydrated
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-clay)]" />
                Comfortable, breathable clothing
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-clay)]" />
                Towel (optional)
              </li>
            </ul>
          </div>
        </div>

        {/* Instructor */}
        <div className="border-t border-[var(--color-sand)] pt-8">
          <h2 className="mb-6 text-[var(--color-earth-dark)]">Your Instructor</h2>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[var(--color-sand)] flex-shrink-0" />
            <div>
              <h3 className="mb-2 text-[var(--color-earth-dark)]">Annie Bliss</h3>
              <p className="text-[var(--color-stone)] text-sm mb-2">RYT-500, Vinyasa Specialist</p>
              <p className="text-[var(--color-stone)] text-sm">
                Annie's Vinyasa classes are known for their creative sequencing, mindful pacing, and emphasis on breath-centered movement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
