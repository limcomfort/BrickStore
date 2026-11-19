import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * Заголовки безопасности для всех ответов.
 *
 * CSP: скрипты только свои (`'unsafe-inline'` нужен инлайн-бутстрапу Next),
 * внешних источников нет. `object-src 'none'` и `frame-ancestors 'none'`
 * закрывают встраивание сайта и плагинов.
 * `X-Content-Type-Options: nosniff` не даёт браузеру «додумать» тип
 * ответа — это основная защита от отдачи файла как HTML/скрипта.
 */
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js вставляет инлайновые скрипты гидратации и RSC-пейлоад
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  images: {
    // SVG больше не проходит через оптимизатор: в SVG может быть скрипт,
    // а оптимизатор отдаёт файл с того же домена (XSS, issue #5).
    // Все иллюстрации каталога — растровые форматы, они и так конвертируются.
    dangerouslyAllowSVG: false,
    // Файлы отдаём вложением, а не inline: если SVG всё же попадёт в CMS,
    // браузер скачает его вместо исполнения в контексте сайта
    contentDispositionType: 'attachment',
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Заголовки на все маршруты, включая API и админку
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // Файлы медиа: принудительно вложение + nosniff
        source: '/api/media/file/:path*',
        headers: [
          { key: 'Content-Disposition', value: 'attachment' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
