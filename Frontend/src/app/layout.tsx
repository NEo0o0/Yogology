import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { AppShell } from './AppShell';

export const metadata: Metadata = {
  title: 'Annie Bliss Yoga | Yoga Studio in Chiang Mai',
  description: 'Join Annie Bliss Yoga in Chiang Mai for Hatha, Vinyasa, Flow, and Office Syndrome therapy. Beginner-friendly classes available. Book now!',
  keywords: [
    'Yoga Chiang Mai',
    'โยคะ เชียงใหม่',
    'Yoga Studio',
    'Office Syndrome',
    'Annie Bliss',
    'Hatha Yoga',
    'Vinyasa Yoga',
    'Flow Yoga',
    'Yoga Classes',
    'Chiang Mai Wellness',
  ],
  authors: [{ name: 'Annie Bliss Yoga' }],
  creator: 'Annie Bliss Yoga',
  publisher: 'Annie Bliss Yoga',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://annieblissyoga.com',
    siteName: 'Annie Bliss Yoga',
    title: 'Annie Bliss Yoga | Yoga Studio in Chiang Mai',
    description: 'Join Annie Bliss Yoga in Chiang Mai for Hatha, Vinyasa, Flow, and Office Syndrome therapy. Beginner-friendly classes available.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Annie Bliss Yoga Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Annie Bliss Yoga | Yoga Studio in Chiang Mai',
    description: 'Join Annie Bliss Yoga in Chiang Mai for Hatha, Vinyasa, Flow, and Office Syndrome therapy.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'Qqa-tSlBBkoEpNN4JA56W6xK_CZ_Koxtkedg7QTaLww',
  },
  icons: {
    icon: '/images/logo-white.svg',
    apple: '/images/logo-white.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
