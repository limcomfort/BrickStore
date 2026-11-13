import { NotFoundContent } from '@/components/NotFoundContent'

// Корневой 404: используется для URL, не совпавших ни с одной группой маршрутов.
// Отдаёт собственный HTML без лейаута, поэтому шапка и подвал не рендерятся —
// внешний вид задан стилями `.not-found`.
export default function NotFound() {
  return (
    <html lang="ru">
      <body>
        <title>Страница не найдена — BrickStore</title>
        <meta name="description" content="Запрошенная страница не существует или была перемещена. Перейдите на главную или в каталог наборов LEGO." />
        <meta name="robots" content="noindex" />
        <main id="main">
          <NotFoundContent />
        </main>
      </body>
    </html>
  )
}
