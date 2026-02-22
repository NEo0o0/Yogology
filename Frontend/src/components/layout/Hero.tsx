'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppSettings } from '@/hooks';

export function Hero() {
  const router = useRouter();
  const { getSetting } = useAppSettings();
  
  const heroTitle = getSetting('home_hero_title', 'Find Your Balance');
  const heroSubtitle = getSetting('home_hero_subtitle', 'Experience mindful movement and inner peace in a nurturing space designed for your wellness journey.');
  const heroImage = getSetting('home_hero_image', '');

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      {heroImage && (
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Peaceful yoga meditation"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <h1 className="text-white mb-6">{heroTitle}</h1>
        <p className="text-white/90 mb-8 max-w-xl mx-auto">
          {heroSubtitle}
        </p>
        <button 
          onClick={() => router.push('/schedule')}
          className="bg-white text-[var(--color-earth-dark)] px-8 py-4 rounded-full hover:bg-[var(--color-sand)] transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
        >
          Start Your Journey
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}
