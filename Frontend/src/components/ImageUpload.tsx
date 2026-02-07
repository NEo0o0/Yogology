import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImageUrl?: string | null;
  bucketName?: string;
}

export function ImageUpload({ 
  onUpload, 
  currentImageUrl, 
  bucketName = 'class-images' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      const publicUrl = urlData.publicUrl;

      // Set preview and call callback
      setPreviewUrl(publicUrl);
      onUpload(publicUrl);
      toast.success('Image uploaded successfully!');

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {previewUrl ? (
        // Preview State
        <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-[var(--color-sand)] bg-[var(--color-cream)]">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors duration-200"
            aria-label="Remove image"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        // Upload State
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative w-full h-64 rounded-lg border-2 border-dashed 
            flex flex-col items-center justify-center gap-4 cursor-pointer
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
              <Loader2 size={48} className="text-[var(--color-sage)] animate-spin" />
              <p className="text-sm text-[var(--color-stone)]">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-[var(--color-sage)]/10 flex items-center justify-center">
                {dragActive ? (
                  <Upload size={32} className="text-[var(--color-sage)]" />
                ) : (
                  <ImageIcon size={32} className="text-[var(--color-sage)]" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-earth-dark)] mb-1">
                  {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-[var(--color-stone)]">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {previewUrl && (
        <p className="mt-2 text-xs text-[var(--color-stone)] text-center">
          Click the X button to remove and upload a different image
        </p>
      )}
    </div>
  );
}
