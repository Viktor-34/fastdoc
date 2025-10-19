import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';

// Запрос на загрузку файла изображения -> получаем URL от бэкенда.
export async function uploadImageRequest(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  const data = await response.json();
  return data.url as string;
}

// Определяем исходные размеры картинки по URL, чтобы вставить верно.
async function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

// Хук интеграции загрузки изображений в редактор.
export function useImageUpload(editor: Editor | null, appendBlock: (content: JSONContent | JSONContent[]) => void) {
  // Флаг, показывающий активную загрузку (можно отобразить спиннер).
  const [isUploading, setIsUploading] = useState(false);

  // Общая логика аплоада: отправляем файл, узнаём размеры, возвращаем метаданные.
  const uploadImage = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadImageRequest(file);
      const { width, height } = await readImageSize(url);
      return { url, width, height };
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Вставляем новое изображение в документ в виде блока.
  const insertImageFromFile = useCallback(async (file: File) => {
    if (!editor) return;
    try {
      const { url, width, height } = await uploadImage(file);
      appendBlock({
        type: 'image',
        attrs: { src: url, alt: file.name, width, height },
      });
    } catch (error) {
      console.error('Failed to upload image', error);
      alert('Не удалось загрузить изображение. Попробуйте снова.');
    }
  }, [appendBlock, editor, uploadImage]);

  // Заменяем существующий блок изображения новым файлом.
  const replaceImageFromFile = useCallback(
    async (range: { from: number; to: number }, file: File) => {
      if (!editor) return;
      try {
        const { url, width, height } = await uploadImage(file);
        const node = editor.state.doc.nodeAt(range.from);
        const existingAttrs = (node?.attrs as Record<string, unknown>) ?? {};
        editor
          .chain()
          .focus()
          .setNodeSelection(range.from)
          .updateAttributes('image', {
            ...existingAttrs,
            src: url,
            alt: file.name,
            width,
            height,
          })
          .run();
      } catch (error) {
        console.error('Failed to replace image', error);
        alert('Не удалось заменить изображение. Попробуйте снова.');
      }
    },
    [editor, uploadImage],
  );

  return {
    isUploading,
    insertImageFromFile,
    replaceImageFromFile,
  };
}
