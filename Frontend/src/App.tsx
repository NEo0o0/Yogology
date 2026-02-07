import { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { WhyAnnieBliss } from './components/WhyAnnieBliss';
import { StudioPreview } from './components/StudioPreview';
import { ClassRules } from './components/ClassRules';
import { Footer } from './components/Footer';
import { AboutHero } from './components/AboutHero';
import { InstructorProfile } from './components/InstructorProfile';
import { OurVision } from './components/OurVision';
import { Certifications } from './components/Certifications';
import { ClassesHero } from './components/ClassesHero';
import { WeeklySchedule } from './components/WeeklySchedule';
import { ClassTypes } from './components/ClassTypes';
import { ClassDetailHero } from './components/ClassDetailHero';
import { ClassDetailContent } from './components/ClassDetailContent';
import { BookingBar } from './components/BookingBar';
import { TeacherTrainingHero } from './components/TeacherTrainingHero';
import { Curriculum } from './components/Curriculum';
import { SchedulePricing } from './components/SchedulePricing';
import { WorkshopsEvents } from './components/WorkshopsEvents';
import { ContactBooking } from './components/ContactBooking';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginRegister } from './components/LoginRegister';
import { MemberDashboard } from './components/MemberDashboard';
import { Pricing } from './components/Pricing';
import { Navbar } from './components/Navbar';
import { AppProvider } from './context/AppContext';
import { supabase } from './utils/supabase/client';
import { useTeacherTraining } from './hooks/useTeacherTraining';
import type { Tables } from './types/database.types';

type Training = Tables<'classes'> & {
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  registration_opens_at: string | null;
};

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'admin';
  phone?: string;
  lineId?: string;
  packageType?: string;
  creditsLeft?: number;
  totalCredits?: number;
  expiryDate?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Initialize as true to wait for session

  // Fetch teacher training data
  const { trainings } = useTeacherTraining({ autoFetch: currentPage === 'teacher-training' });

  // Get the nearest upcoming training
  const upcomingTraining: Training | null = trainings
    ?.filter(t => 
      t.category === 'Teacher Training' && 
      !t.is_cancelled && 
      new Date(t.starts_at) > new Date()
    )
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] || null

  const handleNavigate = (page: string) => {
    // If trying to access admin without auth, redirect to login
    if (page === 'admin' && !isAuthenticated) {
      setCurrentPage('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If trying to access admin but not an admin user, redirect to member dashboard
    if (page === 'admin' && isAuthenticated && currentUser?.role !== 'admin') {
      setCurrentPage('member');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (userData: UserData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    // Redirect ALL users to /member after login
    setCurrentPage('member');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAdmin = () => {
    if (currentUser?.role === 'admin') {
      setCurrentPage('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Restore session on app load
  useEffect(() => {
    async function restoreSession() {
      try {
        console.log('Restoring session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error restoring session:', error);
          setAuthLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found, fetching profile...');
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userData: UserData = {
              id: session.user.id,
              name: profile.full_name || 'User',
              email: session.user.email || '',
              role: (profile.role || 'member') as 'member' | 'admin',
              phone: profile.phone || undefined,
              lineId: profile.contact_info || undefined,
            };

            console.log('Session restored with user:', userData);
            setCurrentUser(userData);
            setIsAuthenticated(true);
          }
        } else {
          console.log('No session found');
        }
      } catch (err) {
        console.error('Unexpected error restoring session:', err);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-cream)] via-white to-[var(--color-sand)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-sage)]"></div>
          <p className="mt-4 text-[var(--color-stone)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Login page (no navbar/footer)
  if (currentPage === 'login') {
    return (
      <AppProvider>
        <LoginRegister 
          onLoginSuccess={handleLoginSuccess}
          onNavigateHome={() => handleNavigate('home')}
        />
      </AppProvider>
    );
  }

  // Member dashboard (no navbar/footer, separate layout)
  // Protected route: redirect to login if not authenticated
  if (currentPage === 'member') {
    if (!isAuthenticated || !currentUser) {
      // Redirect to login if trying to access member area without auth
      setCurrentPage('login');
      return null;
    }
    return (
      <AppProvider>
        <MemberDashboard 
          userData={currentUser} 
          onLogout={handleLogout}
          onNavigateToAdmin={handleNavigateToAdmin}
          onNavigateHome={() => handleNavigate('home')}
          onNavigateToPricing={() => handleNavigate('pricing')}
        />
      </AppProvider>
    );
  }

  // Admin dashboard (no navbar/footer)
  // Protected route: redirect if not authenticated or not admin
  if (currentPage === 'admin') {
    if (!isAuthenticated || !currentUser) {
      setCurrentPage('login');
      return null;
    }
    if (currentUser.role !== 'admin') {
      setCurrentPage('member');
      return null;
    }
    return (
      <AppProvider>
        <AdminDashboard 
          onNavigateHome={() => handleNavigate('home')}
          onLogout={handleLogout}
        />
      </AppProvider>
    );
  }

  // Render public pages with navbar and footer
  return (
    <AppProvider>
      <div className="min-h-screen">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        
        {/* Home Page - No top padding (Hero is full-screen) */}
        {currentPage === 'home' && (
          <>
            <Hero />
            <WhyAnnieBliss />
            <StudioPreview />
            <ClassRules />
          </>
        )}
        
        {/* Other pages with padding for fixed navbar */}
        <main className={currentPage !== 'home' ? 'pt-20' : ''}>
          {/* Schedule Page */}
          {currentPage === 'schedule' && (
            <>
              <ClassesHero />
              <WeeklySchedule onNavigate={handleNavigate} />
              <ClassTypes onNavigate={handleNavigate} />
            </>
          )}
          
          {/* Contact Page */}
          {currentPage === 'contact' && (
            <>
              <ContactBooking />
            </>
          )}
          
          {/* Additional pages (accessible via other navigation) */}
          {currentPage === 'about' && (
            <>
              <AboutHero />
              <InstructorProfile />
              <OurVision />
              <Certifications />
            </>
          )}
          
          {currentPage === 'class-detail' && (
            <>
              <ClassDetailHero />
              <ClassDetailContent />
              <BookingBar onNavigate={handleNavigate} />
            </>
          )}
          
          {currentPage === 'teacher-training' && (
            <>
              <TeacherTrainingHero upcomingTraining={upcomingTraining} />
              <Curriculum />
              <SchedulePricing upcomingTraining={upcomingTraining} />
            </>
          )}
          
          {currentPage === 'workshops' && (
            <>
              <WorkshopsEvents />
            </>
          )}
          
          {currentPage === 'pricing' && (
            <>
              <Pricing 
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
        </main>
        
        <Footer onNavigate={handleNavigate} />
      </div>
    </AppProvider>
  );
}