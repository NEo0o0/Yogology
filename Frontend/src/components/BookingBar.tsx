import { Calendar, ArrowLeft } from 'lucide-react';

interface BookingBarProps {
  onNavigate?: (page: string) => void;
}

export function BookingBar({ onNavigate }: BookingBarProps) {
  const handleBackToSchedule = () => {
    if (onNavigate) {
      onNavigate('schedule');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[var(--color-sand)] shadow-2xl z-50">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Back Button */}
          <button 
            onClick={handleBackToSchedule}
            className="text-[var(--color-stone)] hover:text-[var(--color-earth-dark)] transition-colors duration-300 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Schedule</span>
          </button>

          {/* Price Info */}
          <div className="flex flex-col">
            <span className="text-sm text-[var(--color-stone)]">Drop-in Rate</span>
            <span className="text-2xl text-[var(--color-earth-dark)]">$25</span>
          </div>

          {/* Book Button */}
          <button className="flex-1 md:flex-none bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-105">
            <Calendar size={20} />
            <span className="text-lg">Book This Class</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-3 text-center">
          <p className="text-xs text-[var(--color-stone)]">
            First class free for new students • Unlimited monthly pass available
          </p>
        </div>
      </div>
    </div>
  );
}
