import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'color'],
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
        description: 'Используется в URL: /catalog?category=slug',
      },
    },
    {
      name: 'color',
      type: 'select',
      label: 'Цвет плашки',
      defaultValue: 'blue',
      options: [
        { label: 'Синий', value: 'blue' },
        { label: 'Красный', value: 'red' },
        { label: 'Зелёный', value: 'green' },
        { label: 'Оранжевый', value: 'orange' },
        { label: 'Жёлтый', value: 'yellow' },
        { label: 'Фиолетовый', value: 'purple' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
