// Gato negro que se asoma por el borde superior del pie de página:
// parpadea, mira a los lados y mueve una oreja de vez en cuando. Al pasar
// el cursor por el pie, se asoma un poco más (group-hover en PiePagina).
export default function GatoAsomado({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 64"
      className={`pointer-events-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Orejas */}
      <path className="oreja" d="M22 34 L28 4 L48 22 Z" fill="#1C1829" />
      <path d="M27 28 L30 12 L41 22 Z" fill="#FF8663" opacity="0.55" />
      <path className="oreja" style={{ animationDelay: "-3.4s" }} d="M98 34 L92 4 L72 22 Z" fill="#1C1829" />
      <path d="M93 28 L90 12 L79 22 Z" fill="#FF8663" opacity="0.55" />

      {/* Cabeza */}
      <path d="M14 64 C14 30 34 16 60 16 C86 16 106 30 106 64 Z" fill="#1C1829" />

      {/* Ojos */}
      <g className="mirar">
        <g className="parpadeo">
          <ellipse cx="44" cy="40" rx="7" ry="8" fill="#FFD45C" />
          <ellipse cx="44.6" cy="40.5" rx="2.4" ry="6" fill="#1C1829" />
          <circle cx="46.5" cy="37" r="1.4" fill="#FFFBF5" />
        </g>
        <g className="parpadeo">
          <ellipse cx="76" cy="40" rx="7" ry="8" fill="#FFD45C" />
          <ellipse cx="76.6" cy="40.5" rx="2.4" ry="6" fill="#1C1829" />
          <circle cx="78.5" cy="37" r="1.4" fill="#FFFBF5" />
        </g>
      </g>

      {/* Nariz y bigotes */}
      <path d="M57 50 H63 L60 54 Z" fill="#FF8663" />
      <g stroke="#4F4867" strokeWidth="1.2" strokeLinecap="round">
        <path d="M40 53 L20 50" />
        <path d="M40 56 L21 58" />
        <path d="M80 53 L100 50" />
        <path d="M80 56 L99 58" />
      </g>

      {/* Patitas sobre el borde */}
      <rect x="30" y="56" width="18" height="12" rx="6" fill="#2A253B" />
      <rect x="72" y="56" width="18" height="12" rx="6" fill="#2A253B" />
    </svg>
  );
}
