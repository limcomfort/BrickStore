import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: {
    group: 'Сайт',
  },
  access: {
    read: () => true,
  },
  label: 'Настройки сайта',
  fields: [
    {
      name: 'announcement',
      type: 'text',
      label: 'Баннер-новость в шапке',
    },
    {
      name: 'heroHeading',
      type: 'text',
      label: 'Заголовок на главной',
      required: true,
    },
    {
      name: 'heroHighlight',
      type: 'text',
      label: 'Выделенное слово (жёлтым)',
    },
    {
      name: 'heroText',
      type: 'textarea',
      label: 'Текст на главной',
    },
    {
      name: 'heroCtaLabel',
      type: 'text',
      label: 'Текст кнопки на главной',
      defaultValue: 'Смотреть каталог',
    },
    {
      name: 'contactPhone',
      type: 'text',
      label: 'Телефон',
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'E-mail',
    },
    {
      name: 'footerNote',
      type: 'textarea',
      label: 'Текст в подвале',
    },
  ],
}
