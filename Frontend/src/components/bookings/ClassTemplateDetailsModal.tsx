import { X, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { getDisplayLevel } from '@/constants/levels';
import { ImageCarousel } from '@/components/ui/ImageCarousel';

interface ClassTemplateDetailsModalProps {
  templateData: {
    id: number;
    title: string;
    description: string | null;
    long_description?: string | null;
    level: string | null;
    duration_minutes: number | null;
    default_price: number | null;
    cover_image_url?: string | null;
    gallery_images?: string[] | null;
    color_code?: string | null;
  };
  onClose: () => void;
}

export function ClassTemplateDetailsModal({ templateData, onClose }: ClassTemplateDetailsModalProps) {
  const displayPrice = templateData.default_price && templateData.default_price > 0 
    ? `฿${templateData.default_price.toLocaleString()}` 
    : 'Free';
  
  const displayDuration = templateData.duration_minutes 
    ? `${templateData.duration_minutes} min` 
    : '60 min';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Close"
        >
          <X size={24} className="text-[var(--color-earth-dark)]" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto">
          {/* Gallery Carousel or Cover Image Banner */}
          {templateData.gallery_images && templateData.gallery_images.length > 0 ? (
            <div className="p-6 bg-[var(--color-cream)]">
              <ImageCarousel images={templateData.gallery_images} className="w-full h-96" />
            </div>
          ) : templateData.cover_image_url ? (
            <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)]">
              <img
                src={templateData.cover_image_url}
                alt={templateData.title}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  // Fallback to gradient if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div 
              className="relative w-full aspect-[4/3] flex items-center justify-center"
              style={{
                background: templateData.color_code 
                  ? `linear-gradient(135deg, ${templateData.color_code}, ${templateData.color_code}dd)`
                  : 'linear-gradient(135deg, var(--color-sage), var(--color-clay))'
              }}
            >
              <div className="text-center text-white">
                <h3 className="text-3xl font-bold mb-2">{templateData.title}</h3>
                <p className="text-lg opacity-90">{getDisplayLevel(templateData.level)}</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Title & Level */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-[var(--color-earth-dark)]">
                  {templateData.title}
                </h2>
                <span className="px-3 py-1 bg-[var(--color-sage)]/10 text-[var(--color-sage)] rounded-full text-xs font-medium">
                  Template
                </span>
              </div>
              <span className="inline-block px-4 py-1 bg-[var(--color-sage)]/10 text-[var(--color-sage)] rounded-full text-sm font-medium">
                {getDisplayLevel(templateData.level)}
              </span>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                <Clock size={20} className="text-[var(--color-clay)]" />
                <div>
                  <div className="text-xs text-[var(--color-stone)]">Default Duration</div>
                  <div className="text-sm font-medium text-[var(--color-earth-dark)]">
                    {displayDuration}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[var(--color-cream)] rounded-lg">
                <DollarSign size={20} className="text-[var(--color-clay)]" />
                <div>
                  <div className="text-xs text-[var(--color-stone)]">Default Price</div>
                  <div className="text-sm font-medium text-[var(--color-earth-dark)]">
                    {displayPrice}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {templateData.description && (
              <div className="mb-6">
                <p className="text-[var(--color-stone)] leading-relaxed">
                  {templateData.description}
                </p>
              </div>
            )}

            {/* About this Class - Long Description (if available) */}
            {templateData.long_description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-earth-dark)] mb-3">
                  About this Class
                </h3>
                <div className="text-[var(--color-stone)] leading-relaxed whitespace-pre-line">
                  {templateData.long_description}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full py-4 bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
