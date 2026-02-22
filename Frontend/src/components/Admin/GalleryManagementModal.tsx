"use client";

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Image as ImageIcon, Star } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { MultiImageUpload } from '@/components/ui/MultiImageUpload';
import { toast } from 'sonner';

interface GalleryManagementModalProps {
  workshopId: number;
  workshopTitle: string;
  currentGalleryImages: string[] | null;
  currentCoverImage?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GalleryManagementModal({ 
  workshopId, 
  workshopTitle, 
  currentGalleryImages,
  currentCoverImage,
  onClose,
  onSuccess 
}: GalleryManagementModalProps) {
  const [galleryImages, setGalleryImages] = useState<string[]>(currentGalleryImages || []);
  const [coverImage, setCoverImage] = useState<string | null>(currentCoverImage || null);
  const [saving, setSaving] = useState(false);

  const handleSetAsCover = async (imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ cover_image_url: imageUrl })
        .eq('id', workshopId);

      if (error) throw error;

      setCoverImage(imageUrl);
      toast.success('Cover image updated!');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error updating cover image:', error);
      toast.error(error.message || 'Failed to update cover image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({ gallery_images: galleryImages })
        .eq('id', workshopId);

      if (error) throw error;

      toast.success('Gallery updated successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating gallery:', error);
      toast.error(error.message || 'Failed to update gallery');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-sand)] flex items-center justify-between bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-clay)] text-white">
          <div className="flex items-center gap-3">
            <ImageIcon size={24} />
            <div>
              <h2 className="text-2xl font-bold">Manage Gallery</h2>
              <p className="text-sm text-white/80 mt-1">{workshopTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--color-earth-dark)] mb-2">
              Workshop Gallery Images
            </h3>
            <p className="text-sm text-[var(--color-stone)] mb-4">
              Upload photos from this workshop to create a beautiful gallery for attendees and visitors. 
              These images will be displayed in a slideshow on the workshop details page.
            </p>
          </div>

          {/* Gallery Images Grid */}
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {galleryImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  {/* Set as Cover Button */}
                  <button
                    onClick={() => handleSetAsCover(imageUrl)}
                    className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all duration-200 ${
                      coverImage === imageUrl
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/90 hover:bg-white text-[var(--color-sage)] hover:text-[var(--color-clay)]'
                    }`}
                    title={coverImage === imageUrl ? 'Current cover image' : 'Set as cover image'}
                  >
                    <Star size={16} fill={coverImage === imageUrl ? 'currentColor' : 'none'} />
                  </button>
                  {/* Remove Button */}
                  <button
                    onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))}
                    className="absolute top-2 left-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Area Only - Images are displayed in grid above */}
          <div>
            <h4 className="text-sm font-medium text-[var(--color-earth-dark)] mb-3">Add More Images</h4>
            <MultiImageUpload
              images={[]} 
              onImagesChange={(newImages) => setGalleryImages([...galleryImages, ...newImages])}
              maxImages={20 - galleryImages.length}
            />
          </div>

          <div className="mt-6 p-4 bg-[var(--color-sage)]/5 border border-[var(--color-sage)]/20 rounded-lg">
            <p className="text-sm text-[var(--color-stone)]">
              <strong>💡 Tip:</strong> Upload high-quality photos that showcase the workshop atmosphere, 
              activities, and participants. Recommended: 10-15 images for a great gallery experience.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--color-sand)] flex gap-3 justify-end bg-[var(--color-cream)]">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-[var(--color-sand)] hover:border-[var(--color-sage)] text-[var(--color-earth-dark)] rounded-lg font-medium transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save Gallery</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
