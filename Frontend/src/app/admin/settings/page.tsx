"use client";

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [bookingCutoffMinutes, setBookingCutoffMinutes] = useState<number>(180);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'booking_cutoff_minutes')
        .single();

      if (error) throw error;

      if (data) {
        setBookingCutoffMinutes(parseInt(data.value));
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: bookingCutoffMinutes.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('key', 'booking_cutoff_minutes');

      if (error) throw error;

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-sage)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings size={32} className="text-[var(--color-sage)]" />
            <h1 className="text-3xl font-bold text-[var(--color-earth-dark)]">
              General Settings
            </h1>
          </div>
          <p className="text-[var(--color-stone)]">
            Configure application-wide settings and preferences
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Booking Cutoff Time */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-earth-dark)] mb-2">
                Booking Cutoff Time (Minutes)
              </label>
              <input
                type="number"
                value={bookingCutoffMinutes}
                onChange={(e) => setBookingCutoffMinutes(parseInt(e.target.value) || 0)}
                min="0"
                step="15"
                className="w-full max-w-xs px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
              <p className="mt-2 text-sm text-[var(--color-stone)]">
                Online booking will be disabled this many minutes before a class starts.
                Users will only see the "Manual Book via WhatsApp" option.
              </p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current setting:</strong> {bookingCutoffMinutes} minutes 
                  ({Math.floor(bookingCutoffMinutes / 60)} hours {bookingCutoffMinutes % 60} minutes)
                </p>
              </div>
            </div>

            {/* Common Presets */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-earth-dark)] mb-2">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '1 hour', value: 60 },
                  { label: '2 hours', value: 120 },
                  { label: '3 hours', value: 180 },
                  { label: '6 hours', value: 360 },
                  { label: '12 hours', value: 720 },
                  { label: '24 hours', value: 1440 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setBookingCutoffMinutes(preset.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                      bookingCutoffMinutes === preset.value
                        ? 'border-[var(--color-sage)] bg-[var(--color-sage)] text-white'
                        : 'border-[var(--color-sand)] text-[var(--color-stone)] hover:border-[var(--color-sage)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[var(--color-sand)]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            💡 How This Works
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>When a class starts in less than the cutoff time, online booking is disabled</li>
            <li>Users will only see the "Manual Book via WhatsApp" button</li>
            <li>This prevents last-minute bookings that may not be processed in time</li>
            <li>Changes take effect immediately for all users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
