"use client";

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface MonthYearPickerProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  showMonthOnly?: boolean; // For yearly reports that only need year
}

export function MonthYearPicker({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange,
  showMonthOnly = false 
}: MonthYearPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleMonthSelect = (month: number) => {
    onMonthChange(month);
    if (showMonthOnly) {
      setShowDropdown(false);
    }
  };

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 bg-white rounded-lg shadow-md px-4 py-3 hover:shadow-lg transition-all duration-300 border border-[var(--color-sand)] hover:border-[var(--color-sage)]"
      >
        <Calendar size={20} className="text-[var(--color-sage)]" />
        <div className="text-left min-w-[180px]">
          <div className="text-sm text-[var(--color-stone)]">Selected Period</div>
          <div className="text-[var(--color-earth-dark)]">
            {showMonthOnly ? selectedYear : `${monthNames[selectedMonth]} ${selectedYear}`}
          </div>
        </div>
        <ChevronDown 
          size={20} 
          className={`text-[var(--color-stone)] transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} 
        />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-[var(--color-sand)] z-50 w-full min-w-[320px]">
          {!showMonthOnly && (
            <>
              <div className="p-4 border-b border-[var(--color-sand)]">
                <h3 className="text-sm text-[var(--color-stone)] mb-3">Select Month</h3>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => handleMonthSelect(index)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        selectedMonth === index
                          ? 'bg-[var(--color-sage)] text-white'
                          : 'hover:bg-[var(--color-cream)] text-[var(--color-stone)]'
                      }`}
                    >
                      {month.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="p-4">
            <h3 className="text-sm text-[var(--color-stone)] mb-3">Select Year</h3>
            <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    selectedYear === year
                      ? 'bg-[var(--color-sage)] text-white'
                      : 'hover:bg-[var(--color-cream)] text-[var(--color-stone)]'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
