import { AlertCircle, MessageCircle, Clock } from 'lucide-react';

const policyPoints = [
  {
    icon: Clock,
    text: 'Class cancellations can be made before the class starts, but please be aware that instructors may not see late messages.',
  },
  {
    icon: MessageCircle,
    text: 'The fastest way to inform us of a cancellation in advance is via WhatsApp.',
  },
  {
    icon: AlertCircle,
    text: 'Any last-minute cancellation significantly affects our small studio; please cancel as early as possible to help us grow.',
  },
];

export function CancellationPolicy() {
  return (
    <section className="py-20 px-6 bg-[var(--color-cream)]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center mb-4 text-[var(--color-earth-dark)]">Cancellation Policy</h2>
        <p className="text-center text-[var(--color-stone)] mb-12 max-w-2xl mx-auto">
          We understand that plans change. Here's what you need to know about cancellations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {policyPoints.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-[var(--color-sand)] hover:border-[var(--color-clay)] transition-colors duration-300 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-clay)]/20 flex items-center justify-center">
                  <item.icon size={20} className="text-[var(--color-clay)]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-stone)] leading-relaxed">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-stone)] italic">
            Thank you for your understanding and cooperation in supporting our community.
          </p>
        </div>
      </div>
    </section>
  );
}
