import { Clock, Volume2, Shirt, Flower2, Users2, Sparkle, AlertCircle } from 'lucide-react';

const rules = [
  {
    icon: Clock,
    rule: 'Arrive 15 minutes early',
    description: 'Give yourself time to settle in and prepare mentally.',
  },
  {
    icon: Volume2,
    rule: 'Silence your phone',
    description: 'Honor the sacred space and maintain a peaceful environment.',
  },
  {
    icon: Shirt,
    rule: 'Wear comfortable attire',
    description: 'Choose breathable, flexible clothing for ease of movement.',
  },
  {
    icon: Flower2,
    rule: 'Respect the space',
    description: 'Keep the studio clean and return props to their designated areas.',
  },
  {
    icon: Users2,
    rule: 'Practice mindful awareness',
    description: 'Be considerate of others and maintain a supportive atmosphere.',
  },
  {
    icon: Sparkle,
    rule: 'Listen to your body',
    description: 'Honor your limits and practice at your own pace.',
  },
];

export function ClassRules() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center mb-4 text-[var(--color-earth-dark)]">Studio Etiquette</h2>
        <p className="text-center text-[var(--color-stone)] mb-16 max-w-2xl mx-auto">
          Simple guidelines to ensure a harmonious experience for everyone in our community.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((item, index) => (
            <div
              key={index}
              className="bg-[var(--color-cream)] p-6 rounded-lg border border-[var(--color-sand)] hover:border-[var(--color-terracotta)] transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-sage)]/30 flex items-center justify-center">
                  <item.icon size={20} className="text-[var(--color-clay)]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="mb-2 text-[var(--color-earth-dark)]">{item.rule}</h3>
                  <p className="text-sm text-[var(--color-stone)]">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Late Policy - Featured Card */}
        <div className="mt-8 bg-[var(--color-sage)]/5 border border-[var(--color-sage)]/30 p-8 rounded-2xl">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-sage)]/20 flex items-center justify-center">
              <AlertCircle size={24} className="text-[var(--color-sage)]" strokeWidth={2} />
            </div>
            <div>
              <h3 className="mb-1 text-[var(--color-earth-dark)] font-semibold">Important Note</h3>
              <p className="text-[var(--color-stone)]">
                Class starts on time. Late arrivals may not be allowed to enter the studio to respect the practice of others.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
