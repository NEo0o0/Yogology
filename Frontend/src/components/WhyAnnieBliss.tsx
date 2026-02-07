import { Heart, Users, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'Holistic Approach',
    description: 'We nurture your mind, body, and spirit through intentional practice and compassionate guidance.',
  },
  {
    icon: Users,
    title: 'Community Focus',
    description: 'Join a supportive community where everyone is welcomed, celebrated, and encouraged to grow.',
  },
  {
    icon: Sparkles,
    title: 'Personalized Experience',
    description: 'Every class is thoughtfully designed to meet you where you are on your unique wellness path.',
  },
];

export function WhyAnnieBliss() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center mb-4 text-[var(--color-earth-dark)]">Why Annie Bliss</h2>
        <p className="text-center text-[var(--color-stone)] mb-16 max-w-2xl mx-auto">
          More than just yoga—it's a sanctuary for transformation and self-discovery.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-sand)] mb-6">
                <feature.icon size={32} className="text-[var(--color-clay)]" strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 text-[var(--color-earth-dark)]">{feature.title}</h3>
              <p className="text-[var(--color-stone)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
