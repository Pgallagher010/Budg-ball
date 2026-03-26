const THEME_COLORS = {
  sand: "#d4a574",
  orange: "#ef9a45",
  pink: "#d992b8",
  mint: "#88c9b9",
  lavender: "#a49ad8",
  slate: "#94a3b8",
}

function EarSet({ species, fill }) {
  if (species === "cat" || species === "fox") {
    return (
      <>
        <path d="M 65 57 L 78 26 L 92 54 Z" fill={fill} />
        <path d="M 135 57 L 122 26 L 108 54 Z" fill={fill} />
      </>
    )
  }
  if (species === "panda") {
    return (
      <>
        <circle cx="70" cy="44" r="12" fill="#222" />
        <circle cx="130" cy="44" r="12" fill="#222" />
      </>
    )
  }
  return (
    <>
      <circle cx="56" cy="96" r="18" fill={fill} />
      <circle cx="144" cy="96" r="18" fill={fill} />
    </>
  )
}

export function BallimalAvatar({ species = "cat", colorTheme = "sand", sad = false }) {
  const fill = THEME_COLORS[colorTheme] || THEME_COLORS.sand
  const eyeFill = species === "panda" ? "#111" : "#2d2d2d"
  const cheekColor = sad ? "#93c5fd" : "#f5b8c4"
  const mouthPath = sad ? "M 88 136 Q 100 124 112 136" : "M 88 132 Q 100 142 112 132"

  return (
    <svg
      className={`ballimal-avatar ${sad ? "is-sad" : "is-happy"}`}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <EarSet species={species} fill={fill} />
      <ellipse cx="100" cy="108" rx="78" ry="72" fill={fill} />
      <ellipse cx="100" cy="120" rx="52" ry="44" fill={species === "panda" ? "#f8fafc" : "#f5e6d3"} />

      {species === "panda" && (
        <>
          <ellipse cx="74" cy="98" rx="18" ry="14" fill="#1f2937" />
          <ellipse cx="126" cy="98" rx="18" ry="14" fill="#1f2937" />
        </>
      )}

      <ellipse cx="74" cy="98" rx="9" ry="10" fill={eyeFill} />
      <ellipse cx="126" cy="98" rx="9" ry="10" fill={eyeFill} />
      <ellipse cx="77" cy="95" rx="3" ry="3" fill="#fff" />
      <ellipse cx="129" cy="95" rx="3" ry="3" fill="#fff" />

      {!sad && <ellipse cx="58" cy="118" rx="12" ry="8" fill={cheekColor} opacity="0.9" />}
      {!sad && <ellipse cx="142" cy="118" rx="12" ry="8" fill={cheekColor} opacity="0.9" />}
      {sad && (
        <>
          <path d="M 66 116 L 61 128" stroke={cheekColor} strokeWidth="3" strokeLinecap="round" />
          <path d="M 134 116 L 139 128" stroke={cheekColor} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      <path d="M 100 114 L 93 126 L 107 126 Z" fill="#111" />
      <path d={mouthPath} fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
