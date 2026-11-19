import type { CollectionConfig } from 'payload'

/**
 * Пользователи админки (Payload Auth).
 *
 * Публичного доступа нет: администраторов создаёт seed, а добавление новых
 * идёт через админку уже существующим админом. Без явных правил Payload
 * отдаёт `read` по умолчанию, поэтому список пользователей мог уйти наружу
 * через REST и GraphQL.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Администратор',
    plural: 'Администраторы',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'createdAt'],
  },
  auth: {
    // Короткая сессия админки: токен живёт сутки, а не две недели
    tokenExpiration: 60 * 60 * 24,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    // Анониму не отдаём ничего: ни e-mail, ни сессии. HTTP-роут входа
    // (`/api/users/login`) при этом работает — он обращается к коллекции
    // через Local API, а не через REST-чтение.
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
      maxLength: 80,
      admin: {
        description: 'Отображается в шапке админки',
      },
    },
  ],
}
