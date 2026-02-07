"use client";

import { useState } from 'react';
import { X, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (startDate: string, endDate: string) => void;
}

export function GenerateScheduleModal({ isOpen, onClose, onGenerate }: GenerateScheduleModalProps) {
  // Default to current week
  const today = new Date();
  const weekStart = new Date(today);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const [startDate, setStartDate] = useState(weekStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(weekEnd.toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    onGenerate(startDate, endDate);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-sand)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-sage)]/10 flex items-center justify-center">
              <Zap size={20} className="text-[var(--color-sage)]" />
            </div>
            <h2 className="text-2xl text-[var(--color-earth-dark)]">Generate Schedule</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-cream)] rounded-full transition-colors duration-300"
          >
            <X size={24} className="text-[var(--color-stone)]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-[var(--color-stone)]">
            Select a date range to generate class instances based on your weekly schedule pattern.
          </p>

          {/* Start Date */}
          <div>
            <label className="block text-sm text-[var(--color-stone)] mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm text-[var(--color-stone)] mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
              required
            />
          </div>

          {/* Preview */}
          <div className="bg-[var(--color-cream)] p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-[var(--color-stone)] mb-2">
              <Calendar size={16} />
              <span>Schedule Preview:</span>
            </div>
            <p className="text-[var(--color-earth-dark)]">
              {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-sand)]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Zap size={20} />
              <span>Generate Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
