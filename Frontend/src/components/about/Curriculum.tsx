import { BookOpen, Heart, Users, Brain, Sparkles, Target, Compass, Flower } from 'lucide-react';
import Image from 'next/image';

const modules = [
  {
    icon: Heart,
    title: 'Yoga Philosophy',
    hours: '25 hours',
    description: 'Explore the ancient texts, ethical principles, and philosophical foundations of yoga including the Yoga Sutras and Bhagavad Gita.',
    topics: ['Yoga Sutras of Patanjali', 'Eight Limbs of Yoga', 'Bhagavad Gita', 'Yogic Lifestyle'],
    image: '/images/ttc/TTCYogaPhilosophy.png',
  },
  {
    icon: Brain,
    title: 'Anatomy & Physiology',
    hours: '30 hours',
    description: 'Deep dive into the human body, skeletal system, muscular system, and how yoga affects physical and energetic anatomy.',
    topics: ['Skeletal System', 'Muscular System', 'Nervous System', 'Chakras & Energy'],
    image: '/images/ttc/TTCAnatomy&Physiology.png',
  },
  {
    icon: Flower,
    title: 'Asana Practice',
    hours: '50 hours',
    description: 'Refine your personal practice through detailed exploration of poses, alignment principles, modifications, and variations.',
    topics: ['Standing Poses', 'Inversions', 'Backbends', 'Restorative Practice'],
    image: '/images/ttc/TTCAsanaPractice.png',
  },
  {
    icon: Sparkles,
    title: 'Pranayama & Meditation',
    hours: '15 hours',
    description: 'Master breathwork techniques and meditation practices to cultivate inner awareness and energy management.',
    topics: ['Breathing Techniques', 'Meditation Styles', 'Bandhas & Mudras', 'Energy Regulation'],
    image: '/images/ttc/TTCPranayama&Meditation.png',
  },
  {
    icon: Users,
    title: 'Teaching Methodology',
    hours: '40 hours',
    description: 'Learn the art and science of teaching yoga, including class sequencing, demonstration, observation, and hands-on adjustments.',
    topics: ['Class Sequencing', 'Cueing & Language', 'Adjustments', 'Class Management'],
    image: '/images/ttc/TTCTeachingMethodology.png',
  },
  {
    icon: Target,
    title: 'Practicum',
    hours: '20 hours',
    description: 'Apply your knowledge through practice teaching sessions, receiving feedback, and building confidence in your teaching skills.',
    topics: ['Practice Teaching', 'Peer Feedback', 'Self-Reflection', 'Teaching Observations'],
    image: '/images/ttc/TTCPracticum.png',
  },
  {
    icon: Compass,
    title: 'Professional Development',
    hours: '15 hours',
    description: 'Prepare for your career as a yoga teacher with guidance on ethics, business skills, and building your unique teaching voice.',
    topics: ['Ethics & Boundaries', 'Marketing Basics', 'Business Skills', 'Personal Brand'],
    image: '/images/ttc/TTCProfessionalDevelopment.png',
  },
  {
    icon: BookOpen,
    title: 'Self-Study & Reading',
    hours: '5 hours',
    description: 'Engage with recommended readings and reflective journaling to deepen your understanding and personal integration.',
    topics: ['Required Readings', 'Journaling', 'Self-Reflection', 'Research Projects'],
    image: '/images/ttc/TTCSelf-Study&Reading.png',
  },
];

export function Curriculum() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="mb-4 text-[var(--color-earth-dark)]">Comprehensive Curriculum</h2>
          <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
            Our 200-hour program covers all essential aspects of yoga teaching, meeting and exceeding Yoga Alliance standards.
          </p>
        </div>

        {/* Total Hours Display */}
        <div className="bg-[var(--color-sage)]/20 rounded-lg p-8 mb-12 text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div>
              <div className="text-5xl text-[var(--color-earth-dark)] mb-2">200</div>
              <div className="text-[var(--color-stone)]">Total Hours</div>
            </div>
            <div className="hidden md:block w-px h-16 bg-[var(--color-sand)]" />
            <div>
              <div className="text-5xl text-[var(--color-earth-dark)] mb-2">8</div>
              <div className="text-[var(--color-stone)]">Core Modules</div>
            </div>
            <div className="hidden md:block w-px h-16 bg-[var(--color-sand)]" />
            <div>
              <div className="text-5xl text-[var(--color-earth-dark)] mb-2">4</div>
              <div className="text-[var(--color-stone)]">Weeks</div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-[var(--color-sand)] flex flex-col"
              >
                {/* Module Image (Clean, no text overlay) */}
                <div className="relative w-full aspect-video overflow-hidden border-b border-[var(--color-sand)]">
                  <Image
                    src={module.image}
                    alt={module.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Content Area */}
                <div className="p-6 flex flex-col flex-grow">
                  {/* Header: Icon + Title + Hours */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Icon Badge */}
                    <div className="w-12 h-12 rounded-full bg-[var(--color-sage)]/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={24} className="text-[var(--color-earth-dark)]" />
                    </div>
                    
                    {/* Title & Hours */}
                    <div>
                      <h3 className="text-xl font-bold text-[var(--color-earth-dark)] mb-1">{module.title}</h3>
                      <span className="text-sm font-medium text-[var(--color-stone)] bg-[var(--color-sand)]/30 px-2 py-0.5 rounded">
                        {module.hours}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[var(--color-stone)] text-sm mb-6 leading-relaxed flex-grow">
                    {module.description}
                  </p>

                  {/* Topics */}
                  <div className="space-y-2 mt-auto">
                    <div className="text-xs uppercase tracking-wide text-[var(--color-stone)]/70 font-semibold mb-2">
                      Key Topics:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {module.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 bg-[var(--color-cream)] border border-[var(--color-sand)] rounded-full text-xs text-[var(--color-earth-dark)]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Certification Note */}
        <div className="mt-12 text-center bg-[var(--color-sand)]/30 p-6 rounded-lg border border-[var(--color-sand)]">
          <p className="text-[var(--color-earth-dark)]">
            Upon successful completion, you'll receive a{' '}
            <span className="font-semibold text-[var(--color-sage-dark)]">Yoga Alliance RYT-200 Certification</span>
            {' '}and be eligible to register as a Registered Yoga Teacher.
          </p>
        </div>
      </div>
    </section>
  );
}