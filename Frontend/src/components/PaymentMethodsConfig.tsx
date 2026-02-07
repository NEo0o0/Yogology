'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Loader2, Save } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import type { PaymentConfig, ProductType, PaymentMethodConfig } from '@/types/payment-config.types';
import { DEFAULT_PAYMENT_CONFIG, PRODUCT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/payment-config.types';

export function PaymentMethodsConfig() {
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_config')
        .single();

      if (error) {
        // If no config exists, create default
        if (error.code === 'PGRST116') {
          await createDefaultConfig();
        } else {
          throw error;
        }
      } else if (data?.value) {
        // Parse JSON string to PaymentConfig
        const parsedConfig = typeof data.value === 'string' 
          ? JSON.parse(data.value) 
          : data.value;
        setConfig(parsedConfig as PaymentConfig);
      }
    } catch (err) {
      console.error('Error fetching payment config:', err);
      toast.error('Failed to load payment configuration');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfig = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .insert([{
          key: 'payment_config',
          value: JSON.stringify(DEFAULT_PAYMENT_CONFIG)
        }]);

      if (error) throw error;
      setConfig(DEFAULT_PAYMENT_CONFIG);
    } catch (err) {
      console.error('Error creating default config:', err);
    }
  };

  const handleToggle = (productType: ProductType, method: keyof PaymentMethodConfig) => {
    setConfig(prev => ({
      ...prev,
      [productType]: {
        ...prev[productType],
        [method]: !prev[productType][method]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Force credit_card to false for all product types
      const configToSave: PaymentConfig = {
        class_booking: { ...config.class_booking, credit_card: false },
        workshop: { ...config.workshop, credit_card: false },
        teacher_training: { ...config.teacher_training, credit_card: false },
        packages: { ...config.packages, credit_card: false }
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'payment_config',
          value: JSON.stringify(configToSave)
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast.success('Payment configuration saved successfully');
    } catch (err) {
      console.error('Error saving payment config:', err);
      toast.error('Failed to save payment configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={48} className="text-[var(--color-sage)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] mb-2">
            Payment Methods Configuration
          </h2>
          <p className="text-[var(--color-stone)]">
            Configure which payment methods are available for each service type
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(config) as ProductType[]).map((productType) => (
          <div
            key={productType}
            className="bg-white rounded-xl shadow-md p-6 border border-[var(--color-sand)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-sage)]/20 flex items-center justify-center">
                <CreditCard size={20} className="text-[var(--color-sage)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-earth-dark)]">
                {PRODUCT_TYPE_LABELS[productType]}
              </h3>
            </div>

            <div className="space-y-3">
              {(Object.keys(config[productType]) as (keyof PaymentMethodConfig)[]).filter(method => method !== 'credit_card').map((method) => (
                <div
                  key={method}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-cream)] transition-colors"
                >
                  <span className="text-[var(--color-earth-dark)] font-medium">
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                  <button
                    onClick={() => handleToggle(productType, method)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      config[productType][method]
                        ? 'bg-[var(--color-sage)]'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        config[productType][method] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {config[productType].contact_admin && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ When "Contact Admin" is enabled, users will be directed to contact you instead of using payment gateway.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Changes will affect all checkout flows immediately. Make sure to test after saving.
        </p>
      </div>
    </div>
  );
}
