interface LogoProps {
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ onClick, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 group cursor-pointer"
      aria-label="Annie Bliss Yoga Home"
    >
      {/* Icon Circle */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105`}
      >
        <span className="text-white font-semibold">AB</span>
      </div>

      {/* Text */}
      {showText && (
        <span
          className={`${textSizeClasses[size]} font-semibold text-[var(--color-earth-dark)] group-hover:text-[var(--color-sage)] transition-colors duration-300`}
        >
          Annie Bliss Yoga
        </span>
      )}
    </button>
  );
}
