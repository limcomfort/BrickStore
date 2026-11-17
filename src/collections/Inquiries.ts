import type { CollectionConfig } from 'payload'
import { SESSION_COOKIE } from './Customers'
import { getCustomerByToken } from '@/lib/customer-session'

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
      // Необязательная связь: заявки гостей без кабинета остаются валидными
      name: 'customer',
      label: 'Покупатель',
      type: 'relationship',
      relationTo: 'customers',
      index: true,
      admin: {
        position: 'sidebar',
      },
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
  hooks: {
    /**
     * Покупателя определяем на сервере по cookie-сессии.
     * Клиент не может подставить чужой id: поле `customer` из входящих данных
     * всегда перезаписывается результатом проверки сессии.
     */
    beforeChange: [
      async ({ data, req }) => {
        const token = req.headers
          ?.get('cookie')
          ?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))?.[1]
        const session = await getCustomerByToken(req.payload, token)
        return { ...data, customer: session?.id ?? null }
      },
    ],
  },
}
