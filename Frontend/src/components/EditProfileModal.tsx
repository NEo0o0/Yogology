"use client";

import { useState, useEffect } from 'react';
import { X, User, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface EditProfileModalProps {
  memberId: string;
  currentName: string;
  currentPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProfileModal({ memberId, currentName, currentPhone, onClose, onSuccess }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (!phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim()
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Profile updated successfully!', { duration: 3000 });
      onSuccess();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to update profile: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-sand)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-[var(--color-earth-dark)]">Edit Profile</h2>
            <p className="text-sm text-[var(--color-stone)] mt-1">Update member information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors"
          >
            <X size={24} className="text-[var(--color-stone)]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm text-[var(--color-earth-dark)] mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--color-sand)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm text-[var(--color-earth-dark)] mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--color-sand)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                placeholder="+66 XX XXX XXXX"
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-[var(--color-sand)] text-[var(--color-stone)] rounded-lg hover:bg-[var(--color-cream)] transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
