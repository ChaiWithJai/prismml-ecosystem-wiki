function LogomarkPaths() {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} fill="none">
      {/* Prism: incoming beam, faceted triangle, dispersed spectrum */}
      <path d="M2 20h7" stroke="#94A3B8" />
      <path d="M18 4 30 30H6L18 4Z" stroke="#8B5CF6" />
      <path d="M18 4v26" stroke="#8B5CF6" strokeOpacity={0.35} strokeWidth={1.5} />
      <path d="M27 17.5 34 13" stroke="#8B5CF6" />
      <path d="M28.5 21H35" stroke="#22D3EE" />
      <path d="M30 24.5l5 3" stroke="#34D399" />
    </g>
  )
}

export function Logomark(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 36" fill="none" {...props}>
      <LogomarkPaths />
    </svg>
  )
}

export function Logo(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 300 36" fill="none" {...props}>
      <LogomarkPaths />
      <text
        x="46"
        y="23"
        fill="currentColor"
        fontFamily="Lexend, Inter, ui-sans-serif, system-ui"
        fontSize="16"
        fontWeight="600"
        letterSpacing="0.01em"
      >
        PrismML
      </text>
      <text
        x="120"
        y="23"
        fill="currentColor"
        opacity="0.55"
        fontFamily="Inter, ui-sans-serif, system-ui"
        fontSize="15"
        fontWeight="400"
      >
        Developer
      </text>
    </svg>
  )
}
