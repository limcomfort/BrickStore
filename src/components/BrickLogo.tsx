type Props = {
  className?: string
}

/** Логотип: кирпичик 2×2 с четырьмя пупырышками */
export function BrickLogo({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
      <rect x="4" y="18" width="40" height="26" rx="4" fill="#e3000b" />
      <rect x="4" y="18" width="40" height="26" rx="4" fill="url(#brickShade)" />
      <rect x="7" y="8" width="12" height="10" rx="2.5" fill="#e3000b" />
      <rect x="29" y="8" width="12" height="10" rx="2.5" fill="#e3000b" />
      <circle cx="13" cy="13" r="2.4" fill="#ffce00" />
      <circle cx="35" cy="13" r="2.4" fill="#ffce00" />
      <defs>
        <linearGradient id="brickShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
      </defs>
    </svg>
  )
}
