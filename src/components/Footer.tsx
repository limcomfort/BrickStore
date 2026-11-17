import { BrickLogo } from '@/components/BrickLogo'
import Link from 'next/link'
import { toTelHref } from '@/lib/media'
import type { Category, Setting } from '@/payload-types'

export function Footer({
  settings,
  categories,
}: {
  settings: Setting | null
  categories: Category[]
}) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link className="logo logo-light" href="/">
            <BrickLogo className="logo-mark" />
            <span className="logo-text">
              Brick<em>Store</em>
            </span>
          </Link>
          <p className="footer-note">{settings?.footerNote || 'Интернет-магазин конструкторов LEGO.'}</p>
        </div>

        <nav className="footer-col" aria-label="Каталог">
          <h2 className="footer-heading">Каталог</h2>
          {categories.slice(0, 6).map((cat) => (
            <Link key={cat.id} href={`/catalog?category=${cat.slug}`}>
              {cat.title}
            </Link>
          ))}
          <Link href="/catalog">Все наборы →</Link>
        </nav>

        <div className="footer-col">
          <h2 className="footer-heading">Компания</h2>
          <span>Официальная гарантия 2 года</span>
          <span>Программа «Куб-лига» для постоянных покупателей</span>
          <span>Обмен и возврат 30 дней</span>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Контакты</h2>
          {settings?.contactPhone && (
            <a href={toTelHref(settings.contactPhone)}>{settings.contactPhone}</a>
          )}
          {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>}
          <span>Ежедневно с 10:00 до 21:00</span>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <small>© {new Date().getFullYear()} BrickStore · Все права защищены</small>
        <small>Frontend: Next.js (SSR) · CMS: Payload</small>
      </div>
    </footer>
  )
}
