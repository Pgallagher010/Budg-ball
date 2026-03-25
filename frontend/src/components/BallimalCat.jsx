/**
 * Playful “ballimal” face for the dashboard header (inspired by mascot mockups).
 */
export function BallimalCat() {
  return (
    <svg
      className="ballimal-cat"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="100" cy="108" rx="78" ry="72" fill="#D4A574" />
      <ellipse cx="100" cy="118" rx="52" ry="44" fill="#F5E6D3" />
      <ellipse cx="72" cy="96" rx="22" ry="26" fill="#FFFDF9" />
      <ellipse cx="128" cy="96" rx="22" ry="26" fill="#FFFDF9" />
      <ellipse cx="74" cy="98" rx="10" ry="12" fill="#2D2D2D" />
      <ellipse cx="130" cy="98" rx="10" ry="12" fill="#2D2D2D" />
      <ellipse cx="77" cy="94" rx="3" ry="3" fill="#FFF" />
      <ellipse cx="133" cy="94" rx="3" ry="3" fill="#FFF" />
      <ellipse cx="58" cy="118" rx="12" ry="8" fill="#F5B8C4" opacity="0.85" />
      <ellipse cx="142" cy="118" rx="12" ry="8" fill="#F5B8C4" opacity="0.85" />
      <path
        d="M 88 132 Q 100 142 112 132"
        fill="none"
        stroke="#2D2D2D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M 100 52 L 88 28 L 104 44 Z" fill="#C4956A" />
      <path d="M 100 52 L 112 28 L 96 44 Z" fill="#C4956A" />
    </svg>
  )
}
