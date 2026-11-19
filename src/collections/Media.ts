import type { CollectionConfig } from 'payload'

/**
 * Изображения каталога: иллюстрации наборов и галереи.
 *
 * Загрузка открыта только админу, но тип файла ограничен явно: без этого
 * в `media` можно было положить SVG (или любой другой файл) и получить
 * отдачу его браузеру с того же домена.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Изображение',
    plural: 'Медиа',
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'filename', 'mimeType', 'filesize'],
  },
  access: {
    read: () => true,
    // Публичных загрузок нет: только авторизованный админ
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'alt',
      label: 'Альтернативный текст',
      type: 'text',
      required: true,
      maxLength: 200,
    },
  ],
  upload: {
    // Растровые форматы для карточек каталога
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 240,
        height: 180,
        position: 'centre',
      },
      {
        name: 'card',
        width: 640,
        height: 480,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1280,
        height: 960,
        position: 'centre',
      },
    ],
  },
}
