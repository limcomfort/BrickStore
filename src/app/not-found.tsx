import { NotFoundContent } from '@/components/NotFoundContent'

// Корневой 404: используется для URL, не совпавших ни с одной группой маршрутов.
// Отдаёт собственный HTML без лейаута, поэтому шапка и подвал не рендерятся —
// внешний вид задан стилями `.not-found`.
export default function NotFound() {
  return <NotFoundContent />
}
