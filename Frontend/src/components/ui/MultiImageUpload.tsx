import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Plus } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  bucketName?: string;
  maxImages?: number;
}

export function MultiImageUpload({ 
  images, 
  onImagesChange, 
  bucketName = 'class-images',
  maxImages = 10
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    // Check if adding these files would exceed max
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate all files first
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Add new URLs to existing images
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const handleClick = () => {
    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      {/* Existing Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-[var(--color-sand)] bg-[var(--color-cream)] group"
            >
              <img
                src={imageUrl}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative w-full h-48 rounded-lg border-2 border-dashed 
            flex flex-col items-center justify-center gap-3 cursor-pointer
            transition-all duration-200
            ${dragActive 
              ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5' 
              : 'border-[var(--color-sand)] bg-[var(--color-cream)] hover:border-[var(--color-sage)] hover:bg-[var(--color-sage)]/5'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={40} className="text-[var(--color-sage)] animate-spin" />
              <p className="text-sm text-[var(--color-stone)]">Uploading images...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-[var(--color-sage)]/10 flex items-center justify-center">
                {dragActive ? (
                  <Upload size={28} className="text-[var(--color-sage)]" />
                ) : images.length > 0 ? (
                  <Plus size={28} className="text-[var(--color-sage)]" />
                ) : (
                  <ImageIcon size={28} className="text-[var(--color-sage)]" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-earth-dark)] mb-1">
                  {dragActive 
                    ? 'Drop images here' 
                    : images.length > 0 
                    ? 'Add more images' 
                    : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-[var(--color-stone)]">
                  PNG, JPG, GIF up to 5MB each • {images.length}/{maxImages} images
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {images.length >= maxImages && (
        <p className="text-sm text-[var(--color-stone)] text-center">
          Maximum {maxImages} images reached
        </p>
      )}
    </div>
  );
}
