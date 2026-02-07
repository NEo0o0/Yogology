"use client";

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const ResponsiveMasonry = dynamic(
  () => import('react-responsive-masonry').then((m) => m.ResponsiveMasonry as any),
  { ssr: false }
) as any;

const Masonry = dynamic(
  () => import('react-responsive-masonry').then((m) => m.default as any),
  { ssr: false }
) as any;

const studioImages = [
  {
    url: '/images/our_studio/IMG_0205.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/IMG_0510.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/IMG_0520.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/IMG_1560.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/IMG_2479.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/IMG_2481.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/IMG_2482.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/IMG_2702.JPG',
    alt: 'Annie Bliss Yoga Studio',
  },
  {
    url: '/images/our_studio/our studio.jpg',
    alt: 'Annie Bliss Yoga Studio',
  },
];

export function StudioPreview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-20 px-6 bg-[var(--color-cream)]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center mb-4 text-[var(--color-earth-dark)]">Our Studio</h2>
        <p className="text-center text-[var(--color-stone)] mb-16 max-w-2xl mx-auto">
          A peaceful sanctuary where natural light, calming textures, and mindful design create the perfect environment for your practice.
        </p>

        {mounted ? (
          <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 768: 2, 1024: 3 }}>
            <Masonry gutter="1rem">
              {studioImages.map((image, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 relative"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studioImages.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-lg shadow-md relative">
                <Image src={image.url} alt={image.alt} width={800} height={600} className="w-full h-auto object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
