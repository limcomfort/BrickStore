import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'price', 'inStock', 'featured'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Используется в URL: /catalog/slug',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Slug обязателен'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return 'Slug: только строчные латинские буквы, цифры и дефис (например, dream-home)'
        }
        return true
      },
    },
    {
      name: 'article',
      label: 'Артикул LEGO',
      type: 'text',
      unique: true,
      admin: {
        description: 'Например 60385',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Краткое описание',
      admin: {
        description: 'Показывается в карточке на главной и в каталоге',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Полное описание',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        step: 50,
        description: 'Текущая цена, ₽',
      },
    },
    {
      name: 'oldPrice',
      type: 'number',
      min: 0,
      label: 'Цена до скидки, ₽',
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.price),
        description: 'Должна быть больше текущей цены',
      },
      validate: (value: number | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) => {
        if (value === null || value === undefined || value === 0) return true
        const price = Number(siblingData?.price)
        if (!Number.isNaN(price) && price > 0 && value <= price) {
          return 'Цена до скидки должна быть больше текущей цены'
        }
        return true
      },
    },
    {
      name: 'pieces',
      type: 'number',
      min: 0,
      label: 'Количество деталей',
    },
    {
      name: 'ageMin',
      type: 'number',
      min: 0,
      max: 100,
      label: 'Минимальный возраст',
    },
    {
      name: 'inStock',
      type: 'checkbox',
      defaultValue: true,
      label: 'В наличии',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Хит недели',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Главное изображение',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Галерея',
    },
  ],
}
