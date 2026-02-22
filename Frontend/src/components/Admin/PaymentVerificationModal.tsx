"use client";

import { useState } from 'react';
import { X, Check, XCircle, Eye, Clock, User, CreditCard } from 'lucide-react';

interface PendingPayment {
  id: string;
  user_id: string;
  user_name: string;
  package_name: string;
  package_id: string;
  amount: number;
  payment_method: 'transfer' | 'cash';
  status: 'pending' | 'verified' | 'rejected';
  proof_url?: string; // Path in storage bucket
  created_at: string;
}

interface PaymentVerificationModalProps {
  payment: PendingPayment;
  onClose: () => void;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string) => void;
}

export function PaymentVerificationModal({ 
  payment, 
  onClose, 
  onApprove, 
  onReject 
}: PaymentVerificationModalProps) {
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSignedUrl = async () => {
    if (!payment.proof_url) return;
    
    setIsLoadingImage(true);
    setImageError(false);

    try {
      // In real app, call your backend to get signed URL:
      // const response = await fetch('/api/payments/get-slip-url', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ path: payment.proof_url })
      // });
      // const { signedUrl } = await response.json();
      
      // Simulate API call for signed URL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // IMPORTANT: In production, replace this with actual Supabase signed URL:
      // const { data, error } = await supabase
      //   .storage
      //   .from('payment_slips')
      //   .createSignedUrl(payment.proof_url, 60); // 60 seconds validity
      //
      // if (error) throw error;
      // setSignedImageUrl(data.signedUrl);

      // For demo, using a placeholder
      const demoUrl = `https://images.unsplash.com/photo-1554224311-beee4f0e0a4b?w=800&h=600&fit=crop`;
      setSignedImageUrl(demoUrl);

      console.log('Fetched signed URL for:', payment.proof_url);
    } catch (error) {
      console.error('Error fetching signed URL:', error);
      setImageError(true);
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(payment.id);
      // Success handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this payment? This action cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReject(payment.id);
      // Success handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[var(--color-sand)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl text-[var(--color-earth-dark)]">Verify Payment</h2>
              <p className="text-sm text-[var(--color-stone)]">Review and approve or reject</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-stone)] hover:text-[var(--color-earth-dark)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Details */}
          <div className="bg-[var(--color-cream)] rounded-xl p-6">
            <h3 className="text-lg text-[var(--color-earth-dark)] mb-4">Payment Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-stone)]">Member:</span>
                <span className="text-[var(--color-earth-dark)] flex items-center gap-2">
                  <User size={16} />
                  {payment.user_name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-stone)]">Package:</span>
                <span className="text-[var(--color-earth-dark)]">{payment.package_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-stone)]">Amount:</span>
                <span className="text-2xl text-[var(--color-sage)]">฿{payment.amount.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-stone)]">Method:</span>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  payment.payment_method === 'cash'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {payment.payment_method === 'cash' ? 'Cash' : 'Bank Transfer'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-stone)]">Submitted:</span>
                <span className="text-[var(--color-earth-dark)] text-sm">{formatDate(payment.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Payment Slip Section (Only for bank transfers) */}
          {payment.payment_method === 'transfer' && payment.proof_url && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg text-[var(--color-earth-dark)]">Payment Slip</h3>
                {!signedImageUrl && !imageError && (
                  <button
                    onClick={fetchSignedUrl}
                    disabled={isLoadingImage}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300 disabled:bg-gray-300"
                  >
                    <Eye size={18} />
                    <span>{isLoadingImage ? 'Loading...' : 'View Slip'}</span>
                  </button>
                )}
              </div>

              {/* Image Loading State */}
              {isLoadingImage && (
                <div className="bg-[var(--color-cream)] rounded-xl p-12 text-center">
                  <div className="w-12 h-12 border-4 border-[var(--color-sage)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[var(--color-stone)]">Generating secure link...</p>
                </div>
              )}

              {/* Image Display */}
              {signedImageUrl && !imageError && (
                <div className="border-2 border-[var(--color-sand)] rounded-xl overflow-hidden">
                  <img 
                    src={signedImageUrl} 
                    alt="Payment slip" 
                    className="w-full max-h-96 object-contain bg-gray-50"
                    onError={() => setImageError(true)}
                  />
                  <div className="bg-[var(--color-cream)] px-4 py-2 text-xs text-[var(--color-stone)] flex items-center gap-2">
                    <Clock size={14} />
                    Secure link expires in 60 seconds
                  </div>
                </div>
              )}

              {/* Error State */}
              {imageError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                  <XCircle size={48} className="text-red-600 mx-auto mb-3" />
                  <p className="text-red-600 mb-2">Failed to load payment slip</p>
                  <button
                    onClick={fetchSignedUrl}
                    className="text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!signedImageUrl && !isLoadingImage && !imageError && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Eye size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    Click "View Slip" to securely load the payment proof. The link is valid for 60 seconds for security purposes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cash Payment Note */}
          {payment.payment_method === 'cash' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <CreditCard size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-900 mb-1">Cash Payment</p>
                <p className="text-xs text-yellow-800">
                  Confirm that you have received cash payment from the member before approving.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[var(--color-sand)]">
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={20} />
              <span>Reject</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>Approve & Add Credits</span>
                </>
              )}
            </button>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Approving this payment will automatically:
            </p>
            <ul className="mt-2 ml-4 text-sm text-blue-800 space-y-1">
              <li>• Update payment status to "Verified"</li>
              <li>• Add package credits to the member's account</li>
              <li>• Send confirmation notification to the member</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
