'use client';

import { useCallback, useState } from 'react';
import type { Proposal } from '@/lib/types/proposal';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface GallerySectionProps {
  proposal: Proposal;
  onUpdate: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
}

const FIELD_BORDER_COLOR = 'var(--field-border)';
const TEXT_PRIMARY = '#3d3d3a';
const TEXT_MUTED = '#73726c';

export default function GallerySection({ proposal, onUpdate }: GallerySectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const galleryImages = proposal.galleryImages || [];

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const currentCount = galleryImages.length;
      const maxImages = 6;
      const remainingSlots = maxImages - currentCount;

      if (remainingSlots <= 0) {
        alert('Максимум 6 изображений в галерее');
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      setIsUploading(true);
      try {
        const uploadPromises = filesToUpload.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const data = await response.json();
          return data.url as string;
        });

        const newUrls = await Promise.all(uploadPromises);
        onUpdate('galleryImages', [...galleryImages, ...newUrls]);
      } catch (error) {
        console.error('Failed to upload images:', error);
        alert('Не удалось загрузить изображения');
      } finally {
        setIsUploading(false);
      }
    },
    [galleryImages, onUpdate]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const newImages = galleryImages.filter((_, i) => i !== index);
      onUpdate('galleryImages', newImages);
    },
    [galleryImages, onUpdate]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Галерея изображений</h3>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>
          Добавьте до 6 изображений для демонстрации ваших работ или продукта
        </p>
      </div>

      {galleryImages.length < 6 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative rounded-lg border border-dashed bg-[#FAFAFA] px-6 py-8 text-center transition-colors"
          style={{ borderColor: FIELD_BORDER_COLOR }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <Upload className="mx-auto h-12 w-12" style={{ color: TEXT_MUTED }} />
          <p className="mt-2 text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
            {isUploading ? 'Загрузка...' : 'Перетащите изображения или нажмите для выбора'}
          </p>
          <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
            PNG, JPG до 5MB. Осталось слотов: {6 - galleryImages.length}
          </p>
        </div>
      )}

      {galleryImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {galleryImages.map((url, index) => (
            <div
              key={index}
              className="group relative aspect-video overflow-hidden rounded-lg border bg-white"
              style={{ borderColor: FIELD_BORDER_COLOR }}
            >
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute right-2 top-2 rounded-full bg-[#3d3d3a] p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                title="Удалить изображение"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {galleryImages.length === 0 && (
        <div className="rounded-lg border bg-[#FAFAFA] px-6 py-8 text-center" style={{ borderColor: FIELD_BORDER_COLOR }}>
          <ImageIcon className="mx-auto h-12 w-12" style={{ color: TEXT_MUTED, opacity: 0.55 }} />
          <p className="mt-3 text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
            Галерея пуста
          </p>
          <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
            Добавьте изображения, чтобы они отображались в КП
          </p>
        </div>
      )}
    </div>
  );
}
