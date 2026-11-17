import type { CollectionConfig } from 'payload'

/** 30 дней — сессия кабинета живёт без повторного входа. */
export const SESSION_COOKIE = 'bs_customer'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Покупатель без пароля: вход по e-mail, доступ по токену сессии в httpOnly-cookie.
 * Публичного чтения коллекции нет — только через API кабинета.
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: {
    singular: 'Покупатель',
    plural: 'Покупатели',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'createdAt'],
    description: 'Аккаунты кабинета: избранное и история заявок',
  },
  access: {
    // Создание и вход идут через собственный API, не через REST коллекции
    create: () => false,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      label: 'E-mail',
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 80,
      label: 'Имя',
    },
    {
      name: 'sessionToken',
      type: 'text',
      unique: true,
      index: true,
      // `hidden: true` скрывает поле и в админке, и во всех серверных чтениях,
      // поэтому токен просто не отдаём наружу: коллекция закрыта для анонимов,
      // а REST-доступ к покупателям есть только у админа.
      hidden: true,
    },
    {
      // Это поле нужно серверу для проверки срока, поэтому оно не hidden:
      // наружу его не отдаёт `access.read` на уровне коллекции.
      name: 'sessionExpiresAt',
      type: 'date',
      label: 'Сессия действует до',
    },
    {
      name: 'lastSeenAt',
      type: 'date',
      label: 'Последний визит',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        const email = typeof data.email === 'string' ? data.email : ''
        const name = typeof data.name === 'string' ? data.name : ''
        return {
          ...data,
          email: email.trim().toLowerCase(),
          name: name.trim().replace(/\s+/g, ' '),
        }
      },
    ],
  },
}
