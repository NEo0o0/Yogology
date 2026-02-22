"use client";

import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'success';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          icon: <AlertTriangle size={48} className="text-amber-600" />,
          iconBg: 'bg-amber-100',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'success':
        return {
          icon: <CheckCircle size={48} className="text-green-600" />,
          iconBg: 'bg-green-100',
          confirmButton: 'bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white',
        };
      default:
        return {
          icon: <CheckCircle size={48} className="text-[var(--color-sage)]" />,
          iconBg: 'bg-[var(--color-sage)]/10',
          confirmButton: 'bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="relative p-6 border-b border-[var(--color-sand)]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-[var(--color-cream)] rounded-full transition-colors duration-200"
            aria-label="Close"
          >
            <X size={20} className="text-[var(--color-stone)]" />
          </button>
          <div className="pr-8">
            <h2 className="text-xl md:text-2xl text-[var(--color-earth-dark)]">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-20 h-20 rounded-full ${styles.iconBg} flex items-center justify-center mb-4`}>
              {styles.icon}
            </div>
            <p className="text-base md:text-lg text-[var(--color-stone)]">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 md:py-4 rounded-lg text-[var(--color-stone)] bg-[var(--color-cream)] hover:bg-[var(--color-sand)] transition-all duration-200 text-base md:text-lg font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-6 py-3 md:py-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-base md:text-lg font-medium ${styles.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
