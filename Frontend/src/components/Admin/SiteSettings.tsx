"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { PaymentMethodsConfig } from '@/components/admin/PaymentMethodsConfig';

interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

interface SettingConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'image' | 'textarea';
  category: string;
  placeholder?: string;
}

// Define settings configuration (can be moved to database later)
const SETTINGS_CONFIG: SettingConfig[] = [
  // Home Page Settings
  { key: 'home_hero_title', label: 'Hero Title', type: 'text', category: 'Home Page', placeholder: 'Welcome to Annie Bliss Yoga' },
  { key: 'home_hero_subtitle', label: 'Hero Subtitle', type: 'textarea', category: 'Home Page', placeholder: 'Find your balance...' },
  { key: 'home_hero_image', label: 'Hero Background Image', type: 'image', category: 'Home Page' },
  
  // Contact Settings
  { key: 'contact_email', label: 'Contact Email', type: 'text', category: 'Contact', placeholder: 'info@anniebliss.com' },
  { key: 'contact_phone', label: 'Contact Phone', type: 'text', category: 'Contact', placeholder: '+66 123 456 789' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text', category: 'Contact', placeholder: '66123456789' },
  
  // Payment Settings
  { key: 'bank_name', label: 'Bank Name', type: 'text', category: 'Payment', placeholder: 'Kasikorn Bank' },
  { key: 'bank_account_number', label: 'Bank Account Number', type: 'text', category: 'Payment', placeholder: '123-4-56789-0' },
  { key: 'bank_account_name', label: 'Bank Account Name', type: 'text', category: 'Payment', placeholder: 'Annie Bliss Yoga Studio' },
  { key: 'promptpay_qr_url', label: 'PromptPay QR Code', type: 'image', category: 'Payment' },
  
  // System Settings
  { key: 'site_name', label: 'Site Name', type: 'text', category: 'System', placeholder: 'Annie Bliss Yoga' },
  { key: 'site_description', label: 'Site Description', type: 'textarea', category: 'System', placeholder: 'Yoga studio description...' },
];

export function SiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [bookingCutoff, setBookingCutoff] = useState<string>('180');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('key, value');

      if (fetchError) throw fetchError;

      const settingsMap: Record<string, string> = {};
      (data || []).forEach((setting) => {
        settingsMap[setting.key] = setting.value;
        
        // Handle booking_cutoff_minutes separately
        if (setting.key === 'booking_cutoff_minutes') {
          setBookingCutoff(setting.value);
        }
      });

      setSettings(settingsMap);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error: upsertError } = await supabase
          .from('app_settings')
          .upsert(update, { onConflict: 'key' });

        if (upsertError) throw upsertError;
      }

      // Update booking cutoff separately
      const { error: bookingError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'booking_cutoff_minutes',
          value: bookingCutoff,
          label: 'Booking Cutoff Time (Minutes)',
          type: 'number',
          category: 'General',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (bookingError) throw bookingError;

      toast.success('Settings saved successfully!');
      await fetchSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(`Failed to save settings: ${message}`);
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderInput = (config: SettingConfig) => {
    const value = settings[config.key] || '';

    switch (config.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300 resize-none"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleChange(config.key, e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-[var(--color-sage)] border-[var(--color-sand)] rounded focus:ring-2 focus:ring-[var(--color-sage)]"
            />
            <span className="text-sm text-[var(--color-stone)]">Enabled</span>
          </label>
        );

      case 'image':
        return (
          <ImageUpload
            currentImageUrl={value}
            onUpload={(url) => handleChange(config.key, url)}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
          />
        );
    }
  };

  // Group settings by category
  const groupedSettings = SETTINGS_CONFIG.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SettingConfig[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={48} className="text-[var(--color-sage)] animate-spin mb-4" />
        <p className="text-[var(--color-stone)]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon size={32} className="text-[var(--color-sage)]" />
          <h2 className="text-[var(--color-earth-dark)]">Site Settings</h2>
        </div>
        <p className="text-[var(--color-stone)]">
          Manage global site settings, contact information, and payment details
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-8">
        {Object.entries(groupedSettings).map(([category, configs]) => (
          <div key={category} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-[var(--color-earth-dark)] mb-6 pb-3 border-b border-[var(--color-sand)]">
              {category}
            </h3>
            <div className="space-y-6">
              {configs.map((config) => (
                <div key={config.key}>
                  <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                    {config.label}
                  </label>
                  {renderInput(config)}
                  {config.type === 'image' && settings[config.key] && (
                    <p className="mt-1 text-xs text-[var(--color-stone)] truncate">
                      {settings[config.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Payment Methods Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <PaymentMethodsConfig />
        </div>

        {/* Booking Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-[var(--color-earth-dark)] mb-6 pb-3 border-b border-[var(--color-sand)]">
            Booking Settings
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                Booking Cutoff Time (Minutes)
              </label>
              <input
                type="number"
                value={bookingCutoff}
                onChange={(e) => setBookingCutoff(e.target.value)}
                min="0"
                step="15"
                placeholder="180"
                className="w-full px-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] transition-all duration-300"
              />
              <p className="mt-2 text-sm text-[var(--color-stone)]">
                Time before class starts to disable online booking (e.g., 60 = 1 hour). Set to 0 to disable.
              </p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current setting:</strong> {bookingCutoff} minutes 
                  ({Math.floor(parseInt(bookingCutoff) / 60)} hours {parseInt(bookingCutoff) % 60} minutes)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
