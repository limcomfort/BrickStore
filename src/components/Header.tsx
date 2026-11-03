import { BrickLogo } from '@/components/BrickLogo'
import Link from 'next/link'
import type { Setting } from '@/payload-types'

export function Header({ settings }: { settings: Setting | null }) {
  return (
    <>
      {settings?.announcement && (
        <div className="announce">
          <p>{settings.announcement}</p>
        </div>
      )}
      <header className="site-header">
        <div className="wrap header-bar">
          <Link className="logo" href="/" aria-label="BrickStore — на главную">
            <BrickLogo className="logo-mark" />
            <span className="logo-text">
              Brick<em>Store</em>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Основная навигация">
            <Link href="/">Главная</Link>
            <Link href="/catalog">Каталог</Link>
          </nav>

          <div className="header-actions">
            {settings?.contactPhone && (
              <a className="header-phone" href={`tel:${settings.contactPhone.replace(/[^+\d]/g, '')}`}>
                {settings.contactPhone}
              </a>
            )}
            <Link className="btn btn-sm btn-red" href="/catalog">
              В каталог
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
