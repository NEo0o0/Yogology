"use client";

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface PaymentSlipUploadProps {
  onUploadComplete: (url: string) => void;
  currentSlipUrl?: string | null;
  userId: string;
  onDelete?: () => void;
  showPaymentInfo?: boolean;
}

export function PaymentSlipUpload({ onUploadComplete, currentSlipUrl, userId, onDelete, showPaymentInfo = false }: PaymentSlipUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentSlipUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(showPaymentInfo);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(data.path);

      onUploadComplete(publicUrl);
      toast.success('Payment slip uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload payment slip');
      setPreviewUrl(currentSlipUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Fetch payment settings if showPaymentInfo is true
  useEffect(() => {
    if (showPaymentInfo) {
      const fetchSettings = async () => {
        try {
          setLoadingSettings(true);
          const { data, error } = await supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['bank_name', 'bank_account_number', 'bank_account_name', 'promptpay_qr_url']);

          if (error) throw error;

          console.log('💳 Fetched payment settings for upload modal:', data);

          if (data) {
            const settingsMap = data.reduce((acc, item) => {
              acc[item.key] = item.value;
              return acc;
            }, {} as Record<string, string>);

            setPaymentSettings({
              bankName: settingsMap.bank_name || 'Kasikorn Bank',
              accountNumber: settingsMap.bank_account_number || '',
              accountName: settingsMap.bank_account_name || 'Annie Bliss Yoga Studio',
              promptpayQrUrl: settingsMap.promptpay_qr_url || ''
            });
          }
        } catch (error) {
          console.error('Error fetching payment settings:', error);
        } finally {
          setLoadingSettings(false);
        }
      };
      fetchSettings();
    }
  }, [showPaymentInfo]);

  const handleRemove = async () => {
    setPreviewUrl(null);
    if (onDelete) {
      await onDelete();
    }
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Information Section */}
      {showPaymentInfo && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-earth-dark)]">
            Payment Information | ข้อมูลการชำระเงิน
          </h3>
          
          {loadingSettings ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                <p className="text-sm text-blue-800">Loading payment details...</p>
              </div>
            </div>
          ) : paymentSettings ? (
            <div className="space-y-4">
              {/* Bank Transfer Details */}
              <div className="p-4 bg-[var(--color-cream)] rounded-lg border-2 border-[var(--color-sand)]">
                <h4 className="font-semibold text-[var(--color-earth-dark)] mb-3">
                  Bank Transfer | โอนเงินผ่านธนาคาร
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[var(--color-stone)]">Bank Name:</span>
                    <span className="ml-2 font-medium text-[var(--color-earth-dark)]">{paymentSettings.bankName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-stone)]">Account Number:</span>
                    <span className="ml-2 font-medium text-[var(--color-earth-dark)]">{paymentSettings.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-stone)]">Account Name:</span>
                    <span className="ml-2 font-medium text-[var(--color-earth-dark)]">{paymentSettings.accountName}</span>
                  </div>
                </div>
              </div>

              {/* PromptPay QR Code */}
              {paymentSettings.promptpayQrUrl && (
                <div className="p-4 bg-[var(--color-cream)] rounded-lg border-2 border-[var(--color-sand)] text-center">
                  <h4 className="font-semibold text-[var(--color-earth-dark)] mb-3">
                    PromptPay QR Code | พร้อมเพย์
                  </h4>
                  <img
                    src={paymentSettings.promptpayQrUrl}
                    alt="PromptPay QR Code"
                    className="w-48 h-48 mx-auto border-2 border-[var(--color-sand)] rounded-lg object-contain"
                    onError={(e) => {
                      console.error('QR code failed to load:', paymentSettings.promptpayQrUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <p className="text-xs text-[var(--color-stone)] mt-2">
                    Scan to pay | สแกนเพื่อชำระเงิน
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <label className="block text-sm font-medium text-[var(--color-stone)]">
        Upload Payment Slip (Optional)
      </label>
      
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Payment slip preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-[var(--color-sand)]"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5'
              : 'border-[var(--color-sand)] hover:border-[var(--color-sage)]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-[var(--color-sage)] animate-spin" />
              <p className="text-sm text-[var(--color-stone)]">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-[var(--color-cream)] rounded-full">
                <ImageIcon size={32} className="text-[var(--color-sage)]" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[var(--color-sage)] hover:text-[var(--color-clay)] font-medium transition-colors"
                >
                  Click to upload
                </button>
                <span className="text-[var(--color-stone)]"> or drag and drop</span>
              </div>
              <p className="text-xs text-[var(--color-stone)]">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--color-stone)]">
        💡 Upload your transfer slip to speed up payment verification
      </p>
    </div>
  );
}
