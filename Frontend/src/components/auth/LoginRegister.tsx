"use client";

import { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, MessageCircle, Instagram, Facebook, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { supabase } from '@/utils/supabase/client';
import type { Tables } from '@/types/database.types';

type Profile = Tables<'profiles'>;

interface LoginRegisterProps {
  onLoginSuccess: (userData: {
    id: string;
    name: string;
    email: string;
    role: 'member' | 'admin';
    phone?: string;
    contactInfo?: string;
    contactPlatform?: string;
    packageType?: string;
    creditsLeft?: number;
    totalCredits?: number;
    expiryDate?: string;
  }) => void;
  onNavigateHome: () => void;
}

type ContactPlatform = 'line' | 'instagram' | 'facebook' | 'whatsapp';

export function LoginRegister({ onLoginSuccess, onNavigateHome }: LoginRegisterProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [contactPlatform, setContactPlatform] = useState<ContactPlatform>('line');
  const [contactHandle, setContactHandle] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Error and success states
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const { signIn, signUp, loading: authLoading, error: authError } = useAuth();
  const [verificationSent, setVerificationSent] = useState(false);

  // Helper function to format contact info into clickable URL
  const formatContactUrl = (platform: ContactPlatform, handle: string): string => {
    if (!handle) return '';

    // Remove @ or other special characters
    const cleanHandle = handle.replace(/^@/, '').trim();

    switch (platform) {
      case 'line':
        return `https://line.me/ti/p/~${cleanHandle}`;
      case 'instagram':
        return `https://instagram.com/${cleanHandle}`;
      case 'facebook':
        return `https://facebook.com/${cleanHandle}`;
      case 'whatsapp':
        // Remove non-numeric characters for WhatsApp
        const phoneNumber = cleanHandle.replace(/\D/g, '');
        return `https://wa.me/${phoneNumber}`;
      default:
        return '';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { data, error } = await signIn(loginEmail, loginPassword);
      
      // Debug logging to see exact Supabase response
      console.log('Login Result:', { data, error });

      if (error) {
        console.error('Login error from Supabase:', error);
        setLoginError(error.message || 'Invalid email or password');
        return;
      }

      // Check for session existence (critical for successful auth)
      if (!data?.session) {
        console.error('No session returned from login');
        setLoginError('Login failed: No session created. Please try again.');
        return;
      }

      console.log('Login successful! Session:', data.session);
      console.log('User:', data.user);

      // Fetch profile if not already included
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let profile = (data as any)?.profile as Profile | null | undefined;
      if (!profile && data.user) {
        console.log('Fetching profile for user:', data.user.id);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        profile = profileData;
      }

      if (data.user && profile) {
        // Map Supabase profile to expected format
        const userData = {
          id: data.user.id,
          name: profile.full_name || 'User',
          email: data.user.email || loginEmail,
          role: (profile.role || 'member') as 'member' | 'admin',
          phone: profile.phone || undefined,
          contactInfo: profile.contact_info || undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contactPlatform: (profile as any).contact_platform || undefined,
        };

        console.log('Calling onLoginSuccess with:', userData);
        onLoginSuccess(userData);
        
        router.push('/profile');
      } else {
        console.error('Missing user or profile data');
        setLoginError('Login succeeded but profile data is missing. Please contact support.');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setLoginError('An unexpected error occurred. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    // Validation - contact handle is now required for DB constraint
    if (!registerName || !registerEmail || !registerPhone || !registerPassword || !contactHandle) {
      setRegisterError('Please fill in all required fields');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }

    // Format contact info into clickable URL (required for DB constraint)
    const contactUrl = formatContactUrl(contactPlatform, contactHandle);
    
    if (!contactUrl) {
      setRegisterError('Please provide valid contact information');
      return;
    }

    try {
      const { data, error } = await signUp({
        email: registerEmail,
        password: registerPassword,
        fullName: registerName,
        phone: registerPhone,
        contactInfo: contactUrl,
        contactPlatform: contactPlatform,
      });

      // Debug logging to see exact Supabase response
      console.log('Registration Result:', { data, error });

      if (error) {
        console.error('Registration error from Supabase:', error);
        setRegisterError(error.message || 'Registration failed. Please try again.');
        return;
      }

      // Handle "silent failure" - Supabase returns success but no session
      // This happens when email already exists or email confirmation is required
      if (!data?.session && !error) {
        console.warn('Registration returned no session - email might exist or confirmation required');
        setVerificationSent(true);
        setRegisterError('Email might be already registered or confirmation is required. Please check your email.');
        return;
      }

      // Show verification message
      setVerificationSent(true);
      console.log('Registration successful! Session:', data.session);
      console.log('User:', data.user);

      // If user is created and auto-confirmed (has session)
      if (data?.session && data?.user) {
        console.log('User auto-confirmed, proceeding with auto-login');
        
        // Fetch profile if not already included
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let profile = (data as any)?.profile as Profile | null | undefined;
        if (!profile) {
          console.log('Fetching profile for new user:', data.user.id);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          profile = profileData;
        }

        if (profile && data.user) {
          // Auto-login after successful registration
          const userId = data.user.id;
          const userEmail = data.user.email;
          setTimeout(() => {
            const userData = {
              id: userId,
              name: profile.full_name || registerName,
              email: userEmail || registerEmail,
              role: (profile.role || 'member') as 'member' | 'admin',
              phone: profile.phone || registerPhone,
              contactInfo: profile.contact_info || contactUrl,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              contactPlatform: (profile as any).contact_platform || contactPlatform,
            };

            console.log('Calling onLoginSuccess with:', userData);
            onLoginSuccess(userData);
            
            // Force hard redirect to homepage (full page reload)
            console.log('Redirecting to homepage...');
            window.location.href = '/';
          }, 2000);
        } else {
          console.error('Profile not found for new user');
          setRegisterError('Registration succeeded but profile creation failed. Please try logging in.');
        }
      } else {
        console.log('Email confirmation required - user needs to verify email');
        // Email confirmation required - don't redirect
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      setRegisterError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-cream)] via-white to-[var(--color-sand)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl text-[var(--color-earth-dark)] mb-2">Annie Bliss Yoga</h1>
          <p className="text-[var(--color-stone)]">Find Your Balance</p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-[var(--color-cream)]">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
                setRegisterError('');
              }}
              className={`py-4 transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-white text-[var(--color-sage)] shadow-md'
                  : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setLoginError('');
                setRegisterError('');
              }}
              className={`py-4 transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-white text-[var(--color-sage)] shadow-md'
                  : 'text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
              }`}
            >
              Register
            </button>
          </div>

          {/* Forms */}
          <div className="p-8">
            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Logging in...' : 'Login'}
                </button>

                <div className="text-center text-sm text-[var(--color-stone)]">
                  <p>New user? Create an account to get started!</p>
                </div>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder="+66 81 234 5678"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Contact Platform *
                  </label>
                  <div className="relative">
                    <MessageCircle
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <select
                      value={contactPlatform}
                      onChange={(e) => setContactPlatform(e.target.value as ContactPlatform)}
                      className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      required
                    >
                      <option value="line">Line</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Contact Handle *
                  </label>
                  <div className="relative">
                    {contactPlatform === 'line' && (
                      <MessageCircle
                        size={20}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                      />
                    )}
                    {contactPlatform === 'instagram' && (
                      <Instagram
                        size={20}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                      />
                    )}
                    {contactPlatform === 'facebook' && (
                      <Facebook
                        size={20}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                      />
                    )}
                    <input
                      type="text"
                      value={contactHandle}
                      onChange={(e) => setContactHandle(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder={contactPlatform === 'line' ? '@yourlineID' : 'your handle'}
                      required
                    />
                  </div>
                  <p className="text-xs text-[var(--color-stone)] mt-1">
                    Required: We'll use this to contact you about class updates
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {registerError && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {registerError}
                  </div>
                )}

                {verificationSent ? (
                  <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                    <div className="font-semibold mb-1">✓ Account created successfully!</div>
                    <div>Please check your email to confirm your account.</div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                )}

                <p className="text-xs text-center text-[var(--color-stone)]">
                  By registering, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={onNavigateHome}
            className="text-[var(--color-stone)] hover:text-[var(--color-sage)] transition-colors flex items-center gap-2 mx-auto"
          >
            <Home size={16} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}