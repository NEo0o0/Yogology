'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppProvider } from '@/context/AppContext';

function pageIdToPath(pageId: string) {
  switch (pageId) {
    case 'home':
      return '/';
    case 'schedule':
      return '/schedule';
    case 'pricing':
      return '/pricing';
    case 'contact':
      return '/contact';
    case 'workshops':
      return '/workshops';
    case 'teacher-training':
      return '/teacher-training';
    case 'about':
      return '/about';
    case 'login':
      return '/login';
    case 'member':
      return '/profile';
    default:
      return '/';
  }
}

function pathToPageId(pathname: string) {
  if (pathname.startsWith('/schedule')) return 'schedule';
  if (pathname.startsWith('/pricing')) return 'pricing';
  if (pathname.startsWith('/contact')) return 'contact';
  if (pathname.startsWith('/workshops')) return 'workshops';
  if (pathname.startsWith('/teacher-training')) return 'teacher-training';
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/profile')) return 'member';
  if (pathname.startsWith('/login')) return 'login';
  return 'home';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const currentPage = pathToPageId(pathname);

  const onNavigate = useCallback(
    (pageId: string) => {
      router.push(pageIdToPath(pageId));
    },
    [router]
  );

  return (
    <AppProvider>
      <div className="min-h-screen">
        <Navbar currentPage={currentPage} onNavigate={onNavigate} />
        <main className="pt-20">{children}</main>
        <Footer onNavigate={onNavigate} />
      </div>
    </AppProvider>
  );
}
