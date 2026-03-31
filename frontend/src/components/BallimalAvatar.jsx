import { computeMoodFromHealthHappiness, getResolvedBallimalImage } from "./ballimalAssets.js"

/** Same rect + scaling for body and mood layers so all species and overlays match. */
const AVATAR_VIEW = { x: 0, y: 0, w: 200, h: 200 }
/** Slice keeps every PNG filling the 200×200 box the same way (uniform on-screen size). */
const AVATAR_PRESERVE = "xMidYMid slice"

const MOOD_PROP = {
  veryHappy: "mouthVeryHappy",
  happy: "mouthHappy",
  sad: "mouthSad",
}

function mergeConfig(base, overrides) {
  if (!overrides || typeof overrides !== "object") return base
  const keys = ["full", "mouthVeryHappy", "mouthHappy", "mouthSad"]
  const out = { ...base }
  for (const k of keys) {
    if (overrides[k] !== undefined && overrides[k] !== null && overrides[k] !== "") {
      out[k] = overrides[k]
    }
  }
  return out
}

/**
 * Body: `full` in ballimalAssets.js. Mouth overlays: `mouthVeryHappy` / `mouthHappy` / `mouthSad`.
 * Mood is derived from average of health + happiness (see computeMoodFromHealthHappiness).
 *
 * @param {object} [props.imageOverrides] — optional URLs for full / mouth keys
 */
export function BallimalAvatar({
  species = "cat",
  colorTheme = "sand",
  health = 70,
  happiness = 70,
  imageOverrides,
}) {
  const cfg = mergeConfig(getResolvedBallimalImage(species, colorTheme), imageOverrides)
  const { key: moodKey } = computeMoodFromHealthHappiness(health, happiness)
  const mouthProp = MOOD_PROP[moodKey]
  const mouthHref = cfg[mouthProp]

  const moodClass =
    moodKey === "veryHappy" ? "is-mood-very-happy" : moodKey === "happy" ? "is-mood-happy" : "is-mood-sad"

  const href = cfg.full

  if (href) {
    return (
      <svg
        className={`ballimal-avatar ${moodClass}`}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <image
          href={href}
          x={AVATAR_VIEW.x}
          y={AVATAR_VIEW.y}
          width={AVATAR_VIEW.w}
          height={AVATAR_VIEW.h}
          preserveAspectRatio={AVATAR_PRESERVE}
        />
        {mouthHref ? (
          <image
            href={mouthHref}
            x={AVATAR_VIEW.x}
            y={AVATAR_VIEW.y}
            width={AVATAR_VIEW.w}
            height={AVATAR_VIEW.h}
            preserveAspectRatio={AVATAR_PRESERVE}
          />
        ) : null}
      </svg>
    )
  }

  const label = species.charAt(0).toUpperCase() + species.slice(1)
  const moodLabel = moodKey === "veryHappy" ? "Very happy" : moodKey === "happy" ? "Happy" : "Sad"
  return (
    <svg
      className={`ballimal-avatar ${moodClass}`}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="24" y="24" width="152" height="152" rx="36" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="3" />
      <text
        x="100"
        y="95"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#64748b"
        fontSize="22"
        fontWeight="800"
        fontFamily="system-ui, Segoe UI, sans-serif"
      >
        {label}
      </text>
      <text
        x="100"
        y="122"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#475569"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui, Segoe UI, sans-serif"
      >
        {moodLabel}
      </text>
      <text
        x="100"
        y="148"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#94a3b8"
        fontSize="10"
        fontWeight="600"
        fontFamily="system-ui, Segoe UI, sans-serif"
      >
        Set full + mouth URLs in ballimalAssets.js
      </text>
    </svg>
  )
}
