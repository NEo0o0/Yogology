"use client";

import { useState } from 'react';
import { Camera, Save, Loader2, User } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProfileEditClientProps {
  userId: string;
  initialProfile: {
    full_name: string | null;
    avatar_url: string | null;
    health_condition: string | null;
    phone: string | null;
    nationality: string | null;   // ✅ เพิ่มตรงนี้
    contact_info: string | null;  // ✅ เพิ่มตรงนี้
  };
  isAdmin?: boolean;
}

export function ProfileEditClient({ userId, initialProfile, isAdmin = false }: ProfileEditClientProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.full_name || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [nationality, setNationality] = useState(initialProfile.nationality || ''); // ✅ State ใหม่
  const [contactInfo, setContactInfo] = useState(initialProfile.contact_info || ''); // ✅ State ใหม่
  const [healthCondition, setHealthCondition] = useState(initialProfile.health_condition || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }

      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // ✅ เพิ่ม nationality และ contact_info ลงใน payload
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          phone: phone || null,
          nationality: nationality || null,    // ✅ ส่งค่า update
          contact_info: contactInfo || null,   // ✅ ส่งค่า update
          health_condition: healthCondition || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-[var(--color-earth-dark)]">
        {isAdmin ? 'Edit Student Profile' : 'Edit Profile'}
      </h2>

      {/* Avatar Upload */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-sand)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center text-white text-3xl border-4 border-[var(--color-sand)]">
              {fullName ? getInitials(fullName) : <User size={32} />}
            </div>
          )}
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-[var(--color-sage)] hover:bg-[var(--color-sage)]/80 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Camera size={16} />
            )}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploading}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-earth-dark)]">Profile Picture</p>
          <p className="text-xs text-[var(--color-stone)] mt-1">
            Click the camera icon to upload a new photo
          </p>
          <p className="text-xs text-[var(--color-stone)]">
            Max size: 5MB • Formats: JPG, PNG, GIF
          </p>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full px-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/20 outline-none transition-colors"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          className="w-full px-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/20 outline-none transition-colors"
        />
      </div>

      {/* ✅ Nationality Input */}
      <div>
        <label className="block text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
          Nationality
        </label>
        <input
          type="text"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="e.g., Thai, American, British"
          className="w-full px-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/20 outline-none transition-colors"
        />
      </div>

      {/* ✅ Contact Info Input */}
      <div>
        <label className="block text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
          Contact Info (Line / Instagram / WhatsApp)
        </label>
        <input
          type="text"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          placeholder="e.g., Line: johndoe"
          className="w-full px-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/20 outline-none transition-colors"
        />
      </div>

      {/* Health Condition */}
      <div>
        <label className="block text-sm font-semibold text-[var(--color-earth-dark)] mb-2">
          Health Condition / Medical Notes
          <span className="text-xs text-[var(--color-stone)] font-normal ml-2">
            (Optional - helps instructors provide better support)
          </span>
        </label>
        <textarea
          value={healthCondition}
          onChange={(e) => setHealthCondition(e.target.value)}
          placeholder="e.g., Back pain, knee injury, pregnancy, high blood pressure..."
          rows={4}
          className="w-full px-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/20 outline-none transition-colors resize-none"
        />
        <p className="text-xs text-[var(--color-stone)] mt-1">
          This information will be visible to instructors to ensure your safety during class.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-sand)]">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-sage)] hover:bg-[var(--color-sage)]/80 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}