import type { CollectionConfig } from 'payload'
import { SESSION_COOKIE } from './Customers'
import { getCustomerByToken, getTokenFromRequest } from '@/lib/customer-session'

/** Токен покупателя из cookie внутри заголовков запроса. */
function cookieToken(headers: Headers | null | undefined): string | undefined {
  return headers
    ?.get('cookie')
    ?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))?.[1]
}
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
    defaultColumns: ['createdAt', 'name', 'contact', 'status'],
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
      // `required` пропускает строку из пробелов — без нормализации
      // заявка сохранялась «пустой» (BUG-03).
      validate: (value: string | null | undefined) => {
        const text = typeof value === 'string' ? value.trim() : ''
        if (text.length < 10) return 'Опишите вопрос: минимум 10 символов'
        if (text.length > 1000) return 'Вопрос длиннее 1000 символов'
        return true
      },
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)],
      },
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
     * Покупателя определяем на сервере по токену сессии.
     * Клиент не может подставить чужой id: поле `customer` из входящих данных
     * всегда перезаписывается результатом проверки сессии.
     *
     * Раньше токен брался только из cookie из заголовка, поэтому заявка могла
     * привязаться к покупателю, чья сессия была активна в момент открытия
     * страницы (BUG-02). Теперь источник — сам запрос: Bearer или cookie,
     * а правка из админки связь не трогает.
     */
    beforeChange: [
      async ({ data, req, operation }) => {
        // В админке покупатель указан явно — не обнуляем его служебной логикой.
        if (req.user) return data

        const token = getTokenFromRequest(req) ?? cookieToken(req.headers)

        if (!token) return { ...data, customer: null }

        const session = await getCustomerByToken(req.payload, token)
        if (operation === 'update' && !session) return data

        return { ...data, customer: session?.id ?? null }
      },
    ],
  },
}
