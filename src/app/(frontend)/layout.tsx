import { getCategories, getSettings } from '@/lib/data'
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

  return (
    <html lang="ru">
      <body>
        <div className="site">
          <Header settings={settings} />
          <main className="site-main">{children}</main>
          <Footer settings={settings} categories={categories} />
        </div>
      </body>
    </html>
  )
}
