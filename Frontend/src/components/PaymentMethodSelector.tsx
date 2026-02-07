"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Banknote, QrCode, MessageCircle } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { PaymentSlipUpload } from './PaymentSlipUpload';
import { usePaymentConfig } from '@/hooks';
import type { ProductType } from '@/types/payment-config.types';

interface PaymentMethodSelectorProps {
  hasActivePackage: boolean;
  packageName?: string;
  creditsRemaining?: number;
  isUnlimited?: boolean;
  classPrice: number;
  isWorkshop?: boolean;
  isBundle?: boolean;
  itemName?: string;
  onSelect: (method: 'package' | 'cash' | 'bank_transfer' | 'promptpay', paymentNote?: string, slipUrl?: string) => void;
  selectedMethod?: string;
  userId?: string;
  userFullName?: string;
  productType?: ProductType; // NEW: Specify which product type config to use
}

interface PaymentSettings {
  bankName: string;
  accountNumber: string;
  accountName: string;
  promptpayQrUrl: string;
}

export function PaymentMethodSelector({
  hasActivePackage,
  packageName,
  creditsRemaining,
  isUnlimited = false,
  classPrice,
  isWorkshop = false,
  isBundle = false,
  itemName,
  onSelect,
  selectedMethod,
  userId,
  userFullName,
  productType
}: PaymentMethodSelectorProps) {
  // Determine product type based on props if not explicitly provided
  const inferredProductType: ProductType = productType || 
    (isWorkshop ? 'workshop' : isBundle ? 'packages' : 'class_booking');
  
  const { getMethodsForProduct, shouldShowContactAdmin, loading: configLoading } = usePaymentConfig();
  const paymentConfig = getMethodsForProduct(inferredProductType);
  const showContactAdminOnly = shouldShowContactAdmin(inferredProductType);
  const [showTransferInfo, setShowTransferInfo] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSlipUrl, setPaymentSlipUrl] = useState('');
  const [hasSlipFile, setHasSlipFile] = useState(false);
  const [transferMethod, setTransferMethod] = useState<'bank_transfer' | 'promptpay'>('bank_transfer');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [settings, setSettings] = useState<PaymentSettings>({
    bankName: 'Kasikorn Bank (K-Bank)',
    accountNumber: '123-4-56789-0',
    accountName: 'Annie Bliss Yoga Studio',
    promptpayQrUrl: ''
  });
  const [whatsappNumber, setWhatsappNumber] = useState<string>('66844207947');

  // Debug logging
  console.log('💳 PaymentMethodSelector props:', {
    hasActivePackage,
    packageName,
    creditsRemaining,
    isUnlimited,
    isWorkshop,
    isBundle,
    itemName,
    showPackageOption: hasActivePackage && !isWorkshop && !isBundle && (isUnlimited || (creditsRemaining !== undefined && creditsRemaining > 0))
  });

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['bank_name', 'bank_account_number', 'bank_account_name', 'promptpay_qr_url', 'whatsapp_number']);

      if (error) throw error;

      console.log('🔍 Fetched payment settings:', data);

      const settingsMap: Record<string, string> = {};
      data?.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      const qrUrl = settingsMap.promptpay_qr_url || '';
      const whatsapp = settingsMap.whatsapp_number || '66844207947';
      
      console.log('📱 Current QR URL:', qrUrl);
      console.log('📱 WhatsApp Number:', whatsapp);

      setSettings({
        bankName: settingsMap.bank_name || 'Kasikorn Bank (K-Bank)',
        accountNumber: settingsMap.bank_account_number || '123-4-56789-0',
        accountName: settingsMap.bank_account_name || 'Annie Bliss Yoga Studio',
        promptpayQrUrl: qrUrl
      });
      setWhatsappNumber(whatsapp);
    } catch (error) {
      console.error('❌ Error fetching payment settings:', error);
    }
  };

  const handleMethodSelect = (method: 'package' | 'cash' | 'bank_transfer' | 'promptpay') => {
    if (method === 'bank_transfer' || method === 'promptpay') {
      setTransferMethod(method);
      setShowTransferInfo(true);
    } else {
      onSelect(method);
    }
  };

  const handleTransferConfirm = () => {
    onSelect(transferMethod, paymentNote, paymentSlipUrl);
    setShowTransferInfo(false);
  };

  const handleWhatsAppRedirect = () => {
    let message = '';
    const item = itemName || packageName || 'Yoga Class';
    
    if (userId && userFullName) {
      // Logged-in user - Warm Thai tone
      if (isBundle) {
        message = `สวัสดีค่ะ ฉันคือ ${userFullName} สนใจซื้อแพ็กเกจ ${item} แบบโอนเงินค่ะ`;
      } else {
        message = `สวัสดีค่ะ ฉันคือ ${userFullName} สนใจจอง ${item} แบบโอนเงินค่ะ`;
      }
    } else if (guestName && guestPhone) {
      // Guest user - Warm Thai tone
      message = `สวัสดีค่ะ ฉันคือ ${guestName} (${guestPhone}) สนใจจอง ${item} ค่ะ`;
    } else {
      // Fallback
      message = `สวัสดีค่ะ สนใจ ${item} ค่ะ`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    console.log('📱 Opening WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
    
    // Close guest form if open
    setShowGuestForm(false);
  };

  const handleManualPaymentClick = () => {
    if (userId && userFullName) {
      // Logged-in user - direct redirect
      handleWhatsAppRedirect();
    } else {
      // Guest - show form first
      setShowGuestForm(true);
    }
  };

  // If config is loading, show loading state
  if (configLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-earth-dark)]">
          Loading payment options...
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-earth-dark)]">
        Select Payment Method
      </h3>

      {/* Package Credit Option - Show for credit packages with remaining credits OR unlimited packages */}
      {hasActivePackage && !isWorkshop && !isBundle && (isUnlimited || (creditsRemaining !== undefined && creditsRemaining > 0)) && (
        <button
          onClick={() => handleMethodSelect('package')}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
            selectedMethod === 'package'
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <CreditCard size={24} className="text-[var(--color-sage)] mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-earth-dark)]">
                {isUnlimited 
                  ? `Use Unlimited Package`
                  : `Use Package Credit (${creditsRemaining} ${creditsRemaining === 1 ? 'credit' : 'credits'} left)`
                }
              </div>
              <div className="text-sm text-[var(--color-stone)] mt-1">
                {packageName}
              </div>
              <div className="text-xs text-[var(--color-sage)] mt-1 font-medium">
                ✓ No additional payment required
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Bank Transfer Option - Regular Classes & Bundles */}
      {!isWorkshop && paymentConfig.bank_transfer && (
        <button
          onClick={() => handleMethodSelect('bank_transfer')}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
            selectedMethod === 'bank_transfer'
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <Wallet size={24} className="text-[var(--color-clay)] mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-earth-dark)]">
                Bank Transfer
              </div>
              <div className="text-sm text-[var(--color-stone)] mt-1">
                Transfer ฿{classPrice.toLocaleString()} before class
              </div>
            </div>
          </div>
        </button>
      )}

      {!isWorkshop && paymentConfig.promptpay && (
        <button
          onClick={() => handleMethodSelect('promptpay')}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
            selectedMethod === 'promptpay'
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <QrCode size={24} className="text-[var(--color-clay)] mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-earth-dark)]">
                PromptPay / QR Code
              </div>
              <div className="text-sm text-[var(--color-stone)] mt-1">
                Scan QR code to pay ฿{classPrice.toLocaleString()}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Workshop Transfer Options */}
      {isWorkshop && paymentConfig.bank_transfer && (
        <button
          onClick={() => handleMethodSelect('bank_transfer')}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
            selectedMethod === 'bank_transfer'
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <Wallet size={24} className="text-[var(--color-clay)] mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-earth-dark)]">
                Bank Transfer | โอนเงินผ่านธนาคาร
              </div>
              <div className="text-sm text-[var(--color-stone)] mt-1">
                Transfer ฿{classPrice.toLocaleString()} to confirm registration
              </div>
            </div>
          </div>
        </button>
      )}

      {isWorkshop && paymentConfig.promptpay && (
        <button
          onClick={() => handleMethodSelect('promptpay')}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
            selectedMethod === 'promptpay'
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <QrCode size={24} className="text-[var(--color-clay)] mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-earth-dark)]">
                PromptPay / QR Code | พร้อมเพย์
              </div>
              <div className="text-sm text-[var(--color-stone)] mt-1">
                Scan QR code to pay ฿{classPrice.toLocaleString()}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Cash Option - ALWAYS show for class bookings (ignore payment config) */}
      {!isWorkshop && !isBundle && (
        <button
          onClick={() => handleMethodSelect('cash')}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
            selectedMethod === 'cash'
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <Banknote size={24} className="text-[var(--color-terracotta)] mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-earth-dark)]">
                Pay Cash at Studio | ชำระเงินสดที่สตูดิโอ
              </div>
              <div className="text-sm text-[var(--color-stone)] mt-1">
                Pay ฿{classPrice.toLocaleString()} after class at the studio
              </div>
              <div className="text-xs text-[var(--color-stone)] mt-1">
                ชำระหลังเรียนที่สตูดิโอ
              </div>
            </div>
          </div>
        </button>
      )}

      {/* WhatsApp Contact - Show for all product types when contact_admin is enabled */}
      {paymentConfig.contact_admin && (
        <button
          onClick={handleManualPaymentClick}
          className="w-full p-4 rounded-lg border-2 border-green-500 hover:border-green-600 bg-green-50 hover:bg-green-100 transition-all duration-300 text-left"
        >
          <div className="flex items-start gap-3">
            <MessageCircle size={24} className="text-green-600 mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-green-800">
                Contact via WhatsApp | ติดต่อผ่าน WhatsApp
              </div>
              <div className="text-sm text-green-700 mt-1">
                Chat with us to arrange manual payment or booking
              </div>
              <div className="text-xs text-green-600 mt-1">
                แชทกับเราเพื่อจัดการชำระเงินหรือการจอง
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Guest Form Modal for WhatsApp */}
      {showGuestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[var(--color-earth-dark)] mb-4">
              Guest Information | ข้อมูลผู้เข้าร่วม
            </h3>
            <p className="text-sm text-[var(--color-stone)] mb-4">
              Please provide your details to contact us via WhatsApp
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                  Your Name | ชื่อของคุณ
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                  Phone Number | เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border-2 border-[var(--color-sand)] rounded-lg focus:border-[var(--color-sage)] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGuestForm(false)}
                className="flex-1 py-2 border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] text-[var(--color-earth-dark)] rounded-lg transition-colors"
              >
                Cancel | ยกเลิก
              </button>
              <button
                onClick={handleWhatsAppRedirect}
                disabled={!guestName || !guestPhone}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Info Modal */}
      {showTransferInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[var(--color-earth-dark)] mb-4">
              {transferMethod === 'promptpay' ? 'PromptPay Payment' : 'Bank Transfer Payment'}
            </h3>
            
            <div className="space-y-4 mb-6">
              {transferMethod === 'promptpay' ? (
                settings.promptpayQrUrl ? (
                  <div className="p-4 bg-[var(--color-cream)] rounded-lg text-center">
                    <div className="text-sm text-[var(--color-stone)] mb-3">Scan QR Code to Pay</div>
                    <img
                      src={settings.promptpayQrUrl}
                      alt="PromptPay QR Code"
                      className="w-64 h-64 mx-auto border-2 border-[var(--color-sand)] rounded-lg object-contain"
                      onError={(e) => {
                        console.error('QR code failed to load:', settings.promptpayQrUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="font-semibold text-[var(--color-earth-dark)] text-2xl mt-3">
                      ฿{classPrice.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[var(--color-cream)] border-2 border-[var(--color-sand)] rounded-lg text-center">
                    <div className="text-sm text-[var(--color-stone)]">
                      QR Code is being set up. Please use bank transfer or contact the studio.
                    </div>
                    <div className="text-xs text-[var(--color-stone)] mt-2">
                      กำลังตั้งค่า QR Code กรุณาโอนเงินผ่านธนาคารหรือติดต่อสตูดิโอ
                    </div>
                  </div>
                )
              ) : transferMethod === 'bank_transfer' ? (
                <>
                  <div className="p-4 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-sm text-[var(--color-stone)] mb-1">Bank Name</div>
                    <div className="font-semibold text-[var(--color-earth-dark)]">{settings.bankName}</div>
                  </div>
                  
                  <div className="p-4 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-sm text-[var(--color-stone)] mb-1">Account Number</div>
                    <div className="font-semibold text-[var(--color-earth-dark)]">{settings.accountNumber}</div>
                  </div>
                  
                  <div className="p-4 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-sm text-[var(--color-stone)] mb-1">Account Name</div>
                    <div className="font-semibold text-[var(--color-earth-dark)]">{settings.accountName}</div>
                  </div>
                  
                  <div className="p-4 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-sm text-[var(--color-stone)] mb-1">Amount</div>
                    <div className="font-semibold text-[var(--color-earth-dark)] text-xl">
                      ฿{classPrice.toLocaleString()}
                    </div>
                  </div>
                </>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-[var(--color-stone)] mb-2">
                  Transfer Reference / Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g., Last 4 digits of transfer"
                  className="w-full px-4 py-2 border border-[var(--color-sand)] rounded-lg focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
                />
              </div>

              {userId && (
                <PaymentSlipUpload
                  userId={userId}
                  currentSlipUrl={paymentSlipUrl}
                  onUploadComplete={(url) => {
                    setPaymentSlipUrl(url);
                    setHasSlipFile(true);
                  }}
                />
              )}
            </div>

            <div className="bg-[var(--color-sage)]/10 p-4 rounded-lg mb-6">
              <p className="text-sm text-[var(--color-stone)]">
                💡 <strong>Tip:</strong> Upload your payment slip now or later in your profile to speed up confirmation.
              </p>
            </div>

            {/* Validation Message */}
            {!hasSlipFile && !paymentSlipUrl && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg mb-4">
                <p className="text-sm text-orange-800">
                  ⚠️ Please upload your payment slip to confirm booking
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferInfo(false);
                  setHasSlipFile(false);
                }}
                className="flex-1 px-4 py-3 border-2 border-[var(--color-sand)] rounded-lg hover:border-[var(--color-sage)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferConfirm}
                disabled={!hasSlipFile && !paymentSlipUrl}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  !hasSlipFile && !paymentSlipUrl
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white'
                }`}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
