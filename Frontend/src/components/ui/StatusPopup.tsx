'use client';

import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title?: string;
  message: string;
  buttonText?: string;
}

export function StatusPopup({
  isOpen,
  onClose,
  type,
  title,
  message,
  buttonText
}: StatusPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after mount
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const defaultTitle = isSuccess ? 'Success!' : 'Oops!';
  const defaultButtonText = isSuccess ? 'Continue' : 'Try Again';

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[var(--color-cream)] rounded-2xl shadow-xl max-w-md w-full p-8 transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-stone)] hover:text-[var(--color-earth-dark)] transition-colors"
        >
          <X size={24} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={48} className="text-red-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[var(--color-earth-dark)] text-center mb-4">
          {title || defaultTitle}
        </h2>

        {/* Message */}
        <p className="text-[var(--color-stone)] text-center mb-8 leading-relaxed">
          {message}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg ${
            isSuccess
              ? 'bg-[var(--color-sage)] hover:bg-[var(--color-clay)]'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {buttonText || defaultButtonText}
        </button>
      </div>
    </div>
  );
}
