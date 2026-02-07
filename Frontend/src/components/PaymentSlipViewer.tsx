"use client";

import { X, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PaymentSlipViewerProps {
  slipUrl: string;
  bookingId: number;
  bookingDetails: {
    className: string;
    userName: string;
    amount: number;
    paymentMethod: string;
    paymentNote?: string;
  };
  onApprove: (bookingId: number) => Promise<void>;
  onClose: () => void;
  isAdmin?: boolean;
}

export function PaymentSlipViewer({
  slipUrl,
  bookingId,
  bookingDetails,
  onApprove,
  onClose,
  isAdmin = false
}: PaymentSlipViewerProps) {
  const [approving, setApproving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleApprove = async () => {
    try {
      setApproving(true);
      await onApprove(bookingId);
      onClose();
    } catch (error) {
      console.error('Error approving payment:', error);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-sand)] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[var(--color-earth-dark)]">
              Payment Slip Verification
            </h3>
            <p className="text-sm text-[var(--color-stone)] mt-1">
              Booking ID: #{bookingId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-cream)] rounded-full transition-colors"
          >
            <X size={24} className="text-[var(--color-stone)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-stone)] mb-3">
                  Booking Details
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-xs text-[var(--color-stone)]">Class</div>
                    <div className="font-medium text-[var(--color-earth-dark)]">
                      {bookingDetails.className}
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-xs text-[var(--color-stone)]">Student</div>
                    <div className="font-medium text-[var(--color-earth-dark)]">
                      {bookingDetails.userName}
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-xs text-[var(--color-stone)]">Amount</div>
                    <div className="font-medium text-[var(--color-earth-dark)] text-lg">
                      ฿{bookingDetails.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--color-cream)] rounded-lg">
                    <div className="text-xs text-[var(--color-stone)]">Payment Method</div>
                    <div className="font-medium text-[var(--color-earth-dark)]">
                      {bookingDetails.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                       bookingDetails.paymentMethod === 'promptpay' ? 'PromptPay' : 
                       bookingDetails.paymentMethod}
                    </div>
                  </div>
                  {bookingDetails.paymentNote && (
                    <div className="p-3 bg-[var(--color-cream)] rounded-lg">
                      <div className="text-xs text-[var(--color-stone)]">Reference Note</div>
                      <div className="font-medium text-[var(--color-earth-dark)]">
                        {bookingDetails.paymentNote}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Slip Image */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-stone)] mb-3">
                Payment Slip
              </h4>
              <div className="relative bg-[var(--color-cream)] rounded-lg overflow-hidden border-2 border-[var(--color-sand)]">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={40} className="text-[var(--color-sage)] animate-spin" />
                  </div>
                )}
                <img
                  src={slipUrl}
                  alt="Payment slip"
                  className="w-full h-auto max-h-[500px] object-contain"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                />
              </div>
              <a
                href={slipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-sm text-[var(--color-sage)] hover:text-[var(--color-clay)] transition-colors text-center"
              >
                Open in new tab →
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--color-sand)] bg-[var(--color-cream)]/30">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-[var(--color-sand)] rounded-lg hover:border-[var(--color-sage)] transition-colors"
            >
              Close
            </button>
            {isAdmin && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Approve Payment
                  </>
                )}
              </button>
            )}
          </div>
          {isAdmin && (
            <p className="text-xs text-[var(--color-stone)] mt-3 text-center">
              💡 Approving will mark this booking as "Paid" and set the paid amount to ฿{bookingDetails.amount.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
