import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { PaymentConfig, PaymentMethodConfig } from '@/types/payment-config.types';
import { DEFAULT_PAYMENT_CONFIG } from '@/types/payment-config.types';

export function usePaymentConfig() {
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_config')
        .single();

      if (error) {
        console.warn('Payment config not found, using defaults');
        setConfig(DEFAULT_PAYMENT_CONFIG);
      } else if (data?.value) {
        const parsedConfig = typeof data.value === 'string' 
          ? JSON.parse(data.value) 
          : data.value;
        setConfig(parsedConfig as PaymentConfig);
      }
    } catch (err) {
      console.error('Error fetching payment config:', err);
      setConfig(DEFAULT_PAYMENT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const getMethodsForProduct = (productType: keyof PaymentConfig): PaymentMethodConfig => {
    return config[productType];
  };

  const isMethodEnabled = (productType: keyof PaymentConfig, method: keyof PaymentMethodConfig): boolean => {
    return config[productType][method];
  };

  const shouldShowContactAdmin = (productType: keyof PaymentConfig): boolean => {
    return config[productType].contact_admin;
  };

  return {
    config,
    loading,
    getMethodsForProduct,
    isMethodEnabled,
    shouldShowContactAdmin,
    refetch: fetchConfig
  };
}
