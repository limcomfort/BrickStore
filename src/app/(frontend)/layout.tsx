import { getCategories, getSettings } from '@/lib/data'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionCustomer } from '@/lib/customer-session'
import { FavoritesProvider } from '@/components/FavoritesProvider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './styles.css'

export const metadata = {
  title: 'BrickStore — интернет-магазин конструкторов LEGO',
  description:
    'Собирай свой мир из кирпичиков: каталог наборов LEGO с фильтрами по темам, цены, описания и наличие.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const [settings, categories] = await Promise.all([getSettings(), getCategories()])

  // Сессию читаем на сервере, чтобы шапка не мигала «Войти» у вошедшего
  const payload = await getPayload({ config })
  const session = await getSessionCustomer(payload)
  const initialCustomer = session
    ? { id: session.id, email: session.email, name: session.name }
    : null

  return (
    <html lang="ru">
      <body>
        <FavoritesProvider initialCustomer={initialCustomer}>
          <div className="site">
            <a className="skip-link" href="#main">Перейти к содержимому</a>
            <Header settings={settings} />
            <main className="site-main" id="main" tabIndex={-1}>{children}</main>
            <Footer settings={settings} categories={categories} />
          </div>
        </FavoritesProvider>
      </body>
    </html>
  )
}
