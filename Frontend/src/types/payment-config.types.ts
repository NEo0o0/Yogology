// Payment Configuration Types

export interface PaymentMethodConfig {
  bank_transfer: boolean;
  promptpay: boolean;
  credit_card: boolean;
  contact_admin: boolean;
}

export interface PaymentConfig {
  class_booking: PaymentMethodConfig;
  workshop: PaymentMethodConfig;
  teacher_training: PaymentMethodConfig;
  packages: PaymentMethodConfig;
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  class_booking: {
    bank_transfer: true,
    promptpay: true,
    credit_card: false,
    contact_admin: false
  },
  workshop: {
    bank_transfer: true,
    promptpay: true,
    credit_card: false,
    contact_admin: false
  },
  teacher_training: {
    bank_transfer: true,
    promptpay: false,
    credit_card: false,
    contact_admin: true
  },
  packages: {
    bank_transfer: true,
    promptpay: true,
    credit_card: false,
    contact_admin: false
  }
};

export type ProductType = 'class_booking' | 'workshop' | 'teacher_training' | 'packages';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  class_booking: 'Class Booking',
  workshop: 'Workshop',
  teacher_training: 'Teacher Training',
  packages: 'Packages'
};

export const PAYMENT_METHOD_LABELS: Record<keyof PaymentMethodConfig, string> = {
  bank_transfer: 'Bank Transfer',
  promptpay: 'PromptPay QR',
  credit_card: 'Credit Card',
  contact_admin: 'Contact Admin'
};
