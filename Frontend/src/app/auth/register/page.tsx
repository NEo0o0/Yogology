'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, User, Phone, Globe, MessageCircle, ArrowLeft, Instagram } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    nationality: '',
    contactPlatform: 'line',
    contactValue: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getContactFieldConfig = () => {
    switch (formData.contactPlatform) {
      case 'instagram':
        return {
          label: 'Instagram Username',
          placeholder: 'e.g., @john.yoga or john.yoga',
          icon: Instagram,
        };
      case 'whatsapp':
        return {
          label: 'WhatsApp Number',
          placeholder: 'e.g., 66123456789',
          icon: MessageCircle,
        };
      default: // line
        return {
          label: 'Line ID',
          placeholder: 'e.g., johndoe',
          icon: MessageCircle,
        };
    }
  };

  const generateContactUrl = (platform: string, value: string): string | null => {
    if (!value.trim()) return null;

    const cleanValue = value.trim();

    switch (platform) {
      case 'line':
        return `https://line.me/ti/p/~${cleanValue}`;
      
      case 'instagram':
        // Remove @ if user typed it
        const igUsername = cleanValue.startsWith('@') ? cleanValue.slice(1) : cleanValue;
        return `https://instagram.com/${igUsername}`;
      
      case 'whatsapp':
        // Remove +, spaces, and dashes
        const waNumber = cleanValue.replace(/[+\s-]/g, '');
        return `https://wa.me/${waNumber}`;
      
      default:
        return null;
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.phone) {
      toast.error('Phone number is required');
      return;
    }

    if (!formData.nationality) {
      toast.error('Nationality is required');
      return;
    }

    setLoading(true);

    try {
      // ✅ แก้ไขตรงนี้: ส่งข้อมูลทั้งหมดไปพร้อมกับการสมัครเลย
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            // ส่งไปให้ครบ เพื่อให้ Trigger ทำงาน
            full_name: `${formData.firstName} ${formData.lastName}`,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            nationality: formData.nationality,
            contact_method: formData.contactPlatform, // ส่งประเภท (Line/IG)
            contact_id: formData.contactValue       // ส่ง ID ที่กรอก
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // ❌ ลบส่วน update profiles ทิ้งได้เลย เพราะ Trigger ใน SQL จัดการให้แล้ว
      // การ update ซ้ำซ้อนอาจทำให้เกิด error เรื่อง permission ได้

      toast.success('Registration successful! Please check your email to verify your account.');
      
      // Redirect to login or home
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-cream)] to-[var(--color-sand)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md md:max-w-3xl w-full">
        {/* Back to Home Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-stone)] hover:text-[var(--color-earth-dark)] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-earth-dark)] mb-2">
              Join Annie Bliss Yoga
            </h1>
            <p className="text-[var(--color-stone)]">
              Create your account to start your wellness journey
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Grid Container for Desktop Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* Row 1: First Name | Last Name */}
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                First Name *
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Last Name *
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                />
              </div>
            </div>

            {/* Row 2: Email Address | Phone Number */}
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+66 123 456 789"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                />
              </div>
            </div>

            {/* Row 3: Nationality | Contact Platform */}
            {/* Nationality */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Nationality *
              </label>
              <div className="relative">
                <Globe size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Thai, American, British"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                />
              </div>
            </div>

            {/* Contact Platform Dropdown */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Contact Method (Optional)
              </label>
              <select
                name="contactPlatform"
                value={formData.contactPlatform}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all bg-white"
              >
                <option value="line">Line</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            {/* Row 4: Contact Detail Input - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                {getContactFieldConfig().label}
              </label>
              <div className="relative">
                {(() => {
                  const config = getContactFieldConfig();
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                      <input
                        type="text"
                        name="contactValue"
                        value={formData.contactValue}
                        onChange={handleChange}
                        placeholder={config.placeholder}
                        className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                      />
                    </>
                  );
                })()}
              </div>
              <p className="mt-1 text-xs text-[var(--color-stone)]">
                {formData.contactPlatform === 'line' && 'We\'ll create a Line contact link for instructors'}
                {formData.contactPlatform === 'instagram' && 'We\'ll create an Instagram profile link for instructors'}
                {formData.contactPlatform === 'whatsapp' && 'We\'ll create a WhatsApp chat link for instructors'}
              </p>
            </div>

            {/* Row 5: Password | Confirm Password */}
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all"
                />
              </div>
            </div>
            </div>

            {/* Submit Button - Full Width */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-clay)] text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-stone)]">
              Already have an account?{' '}
              <Link 
                href="/"
                className="text-[var(--color-sage)] hover:text-[var(--color-clay)] font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
