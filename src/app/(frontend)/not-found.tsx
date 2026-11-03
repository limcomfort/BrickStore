import Link from 'next/link'
import { BrickLogo } from '@/components/BrickLogo'

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="nf-inner">
        <BrickLogo className="nf-logo" />
        <span className="nf-code">404</span>
        <h1>Кирпичик не найден</h1>
        <p>Страница, которую вы ищете, не существует или была перемещена.</p>
        <div className="nf-actions">
          <Link className="btn btn-red" href="/">На главную</Link>
          <Link className="btn btn-outline" href="/catalog">В каталог</Link>
        </div>
      </div>
    </div>
  )
}
