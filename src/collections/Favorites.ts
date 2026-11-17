import type { CollectionConfig } from 'payload'

/**
 * Избранные наборы покупателя. Пара «покупатель + товар» уникальна.
 */
export const Favorites: CollectionConfig = {
  slug: 'favorites',
  labels: {
    singular: 'Избранное',
    plural: 'Избранное',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['customer', 'product', 'createdAt'],
    description: 'Наборы, отложенные покупателями',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  indexes: [
    {
      fields: ['customer', 'product'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      index: true,
      label: 'Покупатель',
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
      label: 'Товар',
    },
  ],
}
