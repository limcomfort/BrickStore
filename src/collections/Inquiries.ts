import type { CollectionConfig } from 'payload'

/**
 * Заявки с формы «Задать вопрос» на странице товара.
 * Создание открыто анонимно (форма публичная), чтение и изменение — только авторизованным.
 */
export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: {
    singular: 'Заявка',
    plural: 'Заявки',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['createdAt', 'name', 'phone', 'status'],
    description: 'Вопросы покупателей по конкретным наборам',
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
      required: true,
      maxLength: 80,
    },
    {
      name: 'contact',
      label: 'Телефон или e-mail',
      type: 'text',
      required: true,
      maxLength: 120,
      validate: (value: string | null | undefined) => {
        if (!value) return 'Укажите телефон или e-mail'
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
        const isPhone = /^\+?[\d\s()-]{7,}$/.test(value)
        if (!isEmail && !isPhone) return 'Укажите корректный телефон или e-mail'
        return true
      },
    },
    {
      name: 'message',
      label: 'Вопрос',
      type: 'textarea',
      required: true,
      maxLength: 1000,
    },
    {
      name: 'product',
      label: 'Товар',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'В работе', value: 'in-progress' },
        { label: 'Отвечено', value: 'answered' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
