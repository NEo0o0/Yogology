"use client";

import { useState, useEffect } from 'react';
import { User, Phone, Mail, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/utils/supabase/client';
import { ImageUpload } from './ImageUpload';
import { Avatar } from './Avatar';
import { toast } from 'sonner';

export function UserSettings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[var(--color-stone)]">Please log in to view settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-clay)] p-8 text-white">
          <div className="flex items-center gap-4">
            <Avatar 
              src={formData.avatar_url}
              alt={formData.full_name || 'User'}
              size="xl"
              fallbackText={formData.full_name}
              className="ring-4 ring-white/30"
            />
            <div>
              <h1 className="text-3xl font-bold mb-1">Profile Settings</h1>
              <p className="text-white/80">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-stone)] mb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} />
                Profile Photo
              </div>
            </label>
            <p className="text-xs text-[var(--color-stone)] mb-3">
              Upload a photo so instructors and staff can recognize you
            </p>
            <ImageUpload
              currentImageUrl={formData.avatar_url}
              onUpload={(url) => setFormData({ ...formData, avatar_url: url })}
              bucketName="class-images"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
              <div className="flex items-center gap-2">
                <User size={18} />
                Full Name
              </div>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
              <div className="flex items-center gap-2">
                <Phone size={18} />
                Phone Number
              </div>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
              <div className="flex items-center gap-2">
                <Mail size={18} />
                Email Address
              </div>
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] bg-[var(--color-cream)] text-[var(--color-stone)] cursor-not-allowed"
            />
            <p className="text-xs text-[var(--color-stone)] mt-1">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
              Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300 resize-none"
              rows={4}
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-[var(--color-sand)]">
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
