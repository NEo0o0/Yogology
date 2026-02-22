"use client";

import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Sparkles } from 'lucide-react';
import { useClassTypes } from '@/hooks';
import type { Tables } from '@/types/database.types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { MultiImageUpload } from '@/components/ui/MultiImageUpload';
import { toast } from 'sonner';

type ClassType = Tables<'class_types'>;

export function ClassTypesTab() {
  const { classTypes, loading, error, createClassType, updateClassType, deleteClassType } = useClassTypes();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    long_description: '',
    level: 'All Levels',
    duration_minutes: 75,
    color_code: '#8CA899', // Default sage color
    default_price: 400.00,
    cover_image_url: '',
    gallery_images: [] as string[]
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      long_description: '',
      level: 'Multilevel',
      duration_minutes: 75,
      color_code: '#8CA899',
      default_price: 400.00,
      cover_image_url: '',
      gallery_images: [] as string[]
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        const result = await updateClassType(editingId, formData);
        if (result.error) {
          toast.error(`Error updating class type: ${result.error.message}`);
          return;
        }
        toast.success('Class type updated successfully!');
      } else {
        const result = await createClassType(formData);
        if (result.error) {
          toast.error(`Error creating class type: ${result.error.message}`);
          return;
        }
        toast.success('Class type created successfully!');
      }
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (classType: ClassType) => {
    setFormData({
      title: classType.title,
      description: classType.description || '',
      long_description: (classType as any).long_description || '',
      level: classType.level || 'Multilevel',
      duration_minutes: classType.duration_minutes || 60,
      color_code: classType.color_code || '#8CA899',
      default_price: classType.default_price || 25.00,
      cover_image_url: (classType as any).cover_image_url || '',
      gallery_images: (classType as any).gallery_images || []
    });
    setEditingId(classType.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Class Type',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      onConfirm: async () => {
        const result = await deleteClassType(id);
        if (result.error) {
          const errorMessage = result.error.message || '';
          const errorCode = (result.error as any).code;
          
          if (errorCode === '23503' || errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
            toast.error(
              `Cannot delete "${title}" because it is being used in existing classes or bookings. Please archive it instead or remove all references first.`,
              { duration: 6000 }
            );
          } else {
            toast.error(`Error deleting class type: ${errorMessage}`);
          }
        } else {
          toast.success('Class type deleted successfully');
        }
      }
    });
  };

  const levelOptions = ['Basic Level', 'Intermediate Level', 'Advanced Level', 'Multilevel'];
  const colorPresets = [
    { name: 'Sage', value: '#8CA899' },
    { name: 'Clay', value: '#C18A7A' },
    { name: 'Terracotta', value: '#D4A574' },
    { name: 'Blue', value: '#7A9FC1' },
    { name: 'Purple', value: '#9C7AC1' },
    { name: 'Green', value: '#7AC19C' },
  ];

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl text-[var(--color-earth-dark)] mb-1">Class Types</h2>
          <p className="text-sm text-[var(--color-stone)]">Create and manage your class templates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          <span>Create Class Type</span>
        </button>
      </div>

      {/* Class Types Grid */}
      {classTypes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-[var(--color-cream)] mx-auto mb-4 flex items-center justify-center">
            <Sparkles size={40} className="text-[var(--color-sage)]" />
          </div>
          <h3 className="text-xl text-[var(--color-earth-dark)] mb-2">No Class Types Yet</h3>
          <p className="text-[var(--color-stone)] mb-6">
            Start by creating your first class type. These will serve as templates for your weekly schedule.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all duration-300"
          >
            <Plus size={20} />
            <span>Create Your First Class Type</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classTypes.map((classType) => (
            <div
              key={classType.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Color Header */}
              <div
                className="h-3"
                style={{ backgroundColor: classType.color_code || '#8CA899' }}
              />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl text-[var(--color-earth-dark)] mb-1">{classType.title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[var(--color-stone)]">{classType.level}</span>
                      <span className="text-[var(--color-stone)]">•</span>
                      <span className="text-[var(--color-stone)]">{classType.duration_minutes} mins</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(classType)}
                      className="p-2 hover:bg-[var(--color-cream)] rounded-lg transition-colors duration-300"
                    >
                      <Edit2 size={16} className="text-[var(--color-sage)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(classType.id, classType.title)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-300"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-stone)] leading-relaxed">
                  {classType.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-sand)]">
              <h2 className="text-2xl text-[var(--color-earth-dark)]">
                {editingId ? 'Edit Class Type' : 'Create New Class Type'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-[var(--color-cream)] rounded-full transition-colors duration-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Class Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  placeholder="e.g., Morning Flow"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Short Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300 resize-none"
                  rows={3}
                  placeholder="Brief description of the class"
                  required
                />
              </div>

              {/* Long Description */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  About this Class <span className="text-[var(--color-stone)]">(Optional)</span>
                </label>
                <textarea
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300 resize-none"
                  rows={5}
                  placeholder="Detailed description about the class, benefits, what to expect, etc."
                />
              </div>

              {/* Level and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  >
                    {levelOptions.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-stone)] mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({ ...formData, duration_minutes: isNaN(val) ? 0 : val });
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                    min="15"
                    step="15"
                    required
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Color *
                </label>
                <div className="grid grid-cols-6 gap-3 mb-3">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color_code: preset.value })}
                      className={`h-12 rounded-lg transition-all duration-300 ${
                        formData.color_code === preset.value ? 'ring-2 ring-offset-2 ring-[var(--color-sage)]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.color_code}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                  className="w-full h-12 rounded-lg border border-[var(--color-sand)] cursor-pointer"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Default Price *
                </label>
                <input
                  type="number"
                  value={formData.default_price || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData({ ...formData, default_price: isNaN(val) ? 0 : val });
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent transition-all duration-300"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Cover Image (Optional)
                </label>
                <ImageUpload
                  currentImageUrl={formData.cover_image_url}
                  onUpload={(url) => {
                    setFormData({ ...formData, cover_image_url: url });
                  }}
                />
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm text-[var(--color-stone)] mb-2">
                  Gallery Images (Optional)
                </label>
                <p className="text-xs text-[var(--color-stone)] mb-3">
                  Upload multiple images to showcase this class type in a gallery slideshow
                </p>
                <MultiImageUpload
                  images={formData.gallery_images}
                  onImagesChange={(images) => {
                    setFormData({ ...formData, gallery_images: images });
                  }}
                  maxImages={10}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-sand)]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-lg text-[var(--color-stone)] hover:bg-[var(--color-cream)] transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[var(--color-sage)] hover:bg-[var(--color-clay)] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <Check size={20} />
                  <span>{submitting ? 'Saving...' : (editingId ? 'Update Class Type' : 'Create Class Type')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="warning"
        confirmText="Delete"
      />
    </div>
  );
}