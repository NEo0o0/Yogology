import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
  className?: string;
}

export function Avatar({ 
  src, 
  alt = 'Avatar', 
  size = 'md', 
  fallbackText,
  className = '' 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32,
    xl: 48
  };

  // Get initials from fallback text (e.g., "John Doe" -> "JD")
  const getInitials = (text?: string) => {
    if (!text) return '';
    const words = text.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(fallbackText);

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full overflow-hidden flex items-center justify-center
        bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)]
        text-white font-semibold
        ${className}
      `}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error and show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User size={iconSizes[size]} />
      )}
    </div>
  );
}
