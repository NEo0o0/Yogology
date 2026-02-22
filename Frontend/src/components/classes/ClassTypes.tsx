 "use client";

import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useClassTypes } from '@/hooks';
import { ClassTemplateDetailsModal } from '@/components/bookings/ClassTemplateDetailsModal';
import { getDisplayLevel } from '@/constants/levels';
import type { Tables } from '@/types/database.types';

type ClassType = Tables<'class_types'>;

interface ClassTypesProps {
  onNavigate?: (page: string) => void;
}

export function ClassTypes({ onNavigate }: ClassTypesProps) {
  const { classTypes, loading, error } = useClassTypes();
  const [selectedTemplate, setSelectedTemplate] = useState<ClassType | null>(null);

  const handleViewDetails = (classType: ClassType) => {
    setSelectedTemplate(classType);
  };

  const getLevelBadgeColor = (level: string | null) => {
    if (!level) return 'bg-gray-100 text-gray-700';
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('beginner') || lowerLevel.includes('basic')) {
      return 'bg-teal-100 text-teal-800';
    }
    if (lowerLevel.includes('intermediate')) {
      return 'bg-orange-100 text-orange-800';
    }
    if (lowerLevel.includes('advanced')) {
      return 'bg-red-100 text-red-800';
    }
    // Multilevel/All Levels
    return 'bg-purple-100 text-purple-800';
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '60 minutes';
    return `${minutes} minutes`;
  };

  return (
    <section className="py-20 px-6 bg-[var(--color-cream)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-[var(--color-earth-dark)]">Classes</h2>
          <p className="text-[var(--color-stone)] max-w-2xl mx-auto">
            Choose the right class for your experience level and personal goals.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-[var(--color-sage)] animate-spin mb-4" />
            <p className="text-[var(--color-stone)]">Loading classes...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto">
            <p className="text-red-800">Failed to load classes. Please try again later.</p>
          </div>
        )}

        {/* Class Types Grid */}
        {!loading && !error && classTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {classTypes.map((classType) => (
              <div
                key={classType.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
                style={{
                  borderTop: classType.color_code ? `4px solid ${classType.color_code}` : undefined
                }}
              >
                {/* Thumbnail Image */}
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-clay)]">
                  {classType.cover_image_url ? (
                    <img
                      src={classType.cover_image_url}
                      alt={classType.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Hide image on error and show fallback
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">🧘</span>
                    </div>
                  )}
                  {/* Level Badge Overlay */}
                  {classType.level && (
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-full shadow-lg ${getLevelBadgeColor(getDisplayLevel(classType.level))}`}>
                      <span className="font-medium">{getDisplayLevel(classType.level)}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <h3 className="mb-3 text-[var(--color-earth-dark)]">{classType.title}</h3>
                  <p className="text-[var(--color-stone)] mb-4 text-sm">
                    {classType.description || 'A wonderful yoga class to enhance your practice.'}
                  </p>

                  {/* Class Details */}
                  <div className="space-y-2 mb-6 pb-6 border-b border-[var(--color-sand)]">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-stone)]">Duration:</span>
                      <span className="text-[var(--color-earth-dark)]">{formatDuration(classType.duration_minutes)}</span>
                    </div>
                    {classType.level && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-stone)]">Level:</span>
                        <span className="text-[var(--color-earth-dark)]">{getDisplayLevel(classType.level)}</span>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button 
                    onClick={() => handleViewDetails(classType)}
                    className="w-full bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    View Details
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Class Types Available */}
        {!loading && !error && classTypes.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧘</div>
            <h3 className="mb-2 text-[var(--color-earth-dark)]">
              No Classes Available
            </h3>
            <p className="text-[var(--color-stone)]">
              Check back soon for our classes!
            </p>
          </div>
        )}
      </div>

      {/* Class Template Details Modal */}
      {selectedTemplate && (
        <ClassTemplateDetailsModal
          templateData={{
            id: selectedTemplate.id,
            title: selectedTemplate.title,
            description: selectedTemplate.description,
            long_description: selectedTemplate.long_description || null,
            level: selectedTemplate.level,
            duration_minutes: selectedTemplate.duration_minutes,
            default_price: selectedTemplate.default_price,
            cover_image_url: selectedTemplate.cover_image_url || null,
            gallery_images: selectedTemplate.gallery_images || null,
            color_code: selectedTemplate.color_code,
          }}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </section>
  );
}
