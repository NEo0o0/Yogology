import { 
  Award, 
  BookOpen, 
  Heart, 
  Flower, 
  Music, 
  Moon, 
  Flame, 
  Sun, 
  Wind, 
  Armchair, 
  Feather, 
  Sparkles 
} from 'lucide-react';

const certifications = [
  {
    icon: Flower,
    title: 'RYT-500',
    organization: 'Yoga Alliance',
    description: '500-Hour Registered Yoga Teacher',
  },
  {
    icon: Music,
    title: 'Sound Healing',
    organization: 'Vibrational Therapy',
    description: 'Certified Sound Healing Practitioner',
  },
  {
    icon: Moon,
    title: 'Yin Yoga',
    organization: 'Yoga Specialist',
    description: 'Deep Stretching & Fascia Release',
  },
  {
    icon: Flame,
    title: 'Ashtanga',
    organization: 'Traditional Yoga',
    description: 'Primary Series & Dynamic Flow',
  },
  {
    icon: Sun,
    title: 'Hatha',
    organization: 'Traditional Yoga',
    description: 'Balance of Body, Mind & Energy',
  },
  {
    icon: Wind,
    title: 'Inside Flow',
    organization: 'Modern Vinyasa',
    description: 'Moving to the Beat & Breath',
  },
  {
    icon: Armchair,
    title: 'Chair Yoga',
    organization: 'Accessible Yoga',
    description: 'Gentle Movement for All Ages',
  },
  {
    icon: Feather,
    title: 'Aerial Yoga',
    organization: 'Anti-Gravity',
    description: 'Strength & Flexibility in Flight',
  },
  {
    icon: Sparkles,
    title: 'Meditation',
    organization: 'Mindfulness',
    description: 'Breathwork & Mental Clarity',
  },
];

export function Certifications() {
  return (
    <section className="py-20 px-6 bg-white">
      {/* ขยาย max-width นิดหน่อยเพื่อให้ 5 ก้อนไม่อึดอัด */}
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-[var(--color-earth-dark)]">Certifications & Training</h2>
          <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
            Committed to excellence through continuous learning and professional development in yoga and holistic wellness.
          </p>
        </div>

        {/* เปลี่ยนจาก Grid เป็น Flex + Justify Center */}
        <div className="flex flex-wrap justify-center gap-6">
          {certifications.map((cert, index) => (
            <div
              key={index}
              // กำหนดความกว้าง:
              // sm (มือถือแนวนอน) = 2 ก้อน
              // lg (แท็บเล็ต/จอเล็ก) = 3 ก้อน
              // xl (จอใหญ่) = 5 ก้อน (กว้างประมาณ 19% เพื่อให้มีที่ว่างสำหรับ gap)
              className="w-full sm:w-[45%] lg:w-[30%] xl:w-[18%] flex flex-col items-center text-center p-6 rounded-lg bg-[var(--color-cream)] border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] transition-colors duration-300"
            >
              {/* Icon/Logo */}
              <div className="w-20 h-20 rounded-full bg-white border-2 border-[var(--color-terracotta)] flex items-center justify-center mb-4">
                <cert.icon size={36} className="text-[var(--color-clay)]" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-[var(--color-earth-dark)] font-semibold whitespace-nowrap">{cert.title}</h3>
              
              {/* Organization */}
              <p className="text-sm text-[var(--color-terracotta)] mb-2 font-medium">
                {cert.organization}
              </p>

              {/* Description */}
              <p className="text-sm text-[var(--color-stone)]">
                {cert.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-[var(--color-sage)]/20 px-8 py-6 rounded-lg">
            <p className="text-[var(--color-earth-dark)]">
              Continuing Education: Yin Yoga/Chair Yoga
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}