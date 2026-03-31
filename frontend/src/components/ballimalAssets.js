/**
 * Ballimal images live under `public/ballimals/Ballimal images/` (see folder name with space).
 *
 * - `full` — body image for the species.
 * - `mouthVeryHappy`, `mouthHappy`, `mouthSad` — optional mood overlays (same canvas size as `full`;
 *   drawn on top at identical 200×200 scaling). Use `null` when the full sprite already includes the face.
 *
 * Optional theme: keys like `cat__sand` with partial fields.
 */

/** Encodes the subfolder name so URLs work in the browser (`Ballimal images` → %20). */
const ballimalDir = `/ballimals/${encodeURIComponent("Ballimal images")}`

const u = (filename) => `${ballimalDir}/${filename}`

const empty = () => ({
  full: null,
  mouthVeryHappy: null,
  mouthHappy: null,
  mouthSad: null,
})

export const BALLIMAL_IMAGE_URLS = {
  cat: {
    full: u("cat.png"),
    mouthVeryHappy: u("extrahappy.png"),
    mouthHappy: u("neutral.png"),
    mouthSad: u("sad.png"),
  },
  fox: {
    full: u("fox.png"),
    mouthVeryHappy: u("extrahappy.png"),
    mouthHappy: u("neutral.png"),
    mouthSad: u("sad.png"),
  },
  monkey: {
    full: u("monkey.png"),
    mouthVeryHappy: u("extrahappy.png"),
    mouthHappy: u("neutral.png"),
    mouthSad: u("sad.png"),
  },
  /** Full art already includes a smile; skip overlays to avoid double faces. */
  panda: {
    full: u("panda.png"),
    mouthVeryHappy: null,
    mouthHappy: null,
    mouthSad: null,
  },
}

/**
 * Mood from average of health + happiness (0–100 each):
 * - 70–100 avg → very happy
 * - 40–69 avg → happy
 * - 0–39 avg → sad
 */
export function computeMoodFromHealthHappiness(health, happiness) {
  const h = Math.max(0, Math.min(100, Number(health)))
  const hap = Math.max(0, Math.min(100, Number(happiness)))
  const score = (h + hap) / 2
  if (score >= 70) return { key: 'veryHappy', score }
  if (score >= 40) return { key: 'happy', score }
  return { key: 'sad', score }
}

export function getResolvedBallimalImage(species, colorTheme) {
  const s = species && BALLIMAL_IMAGE_URLS[species] ? species : 'cat'
  const base = { ...empty(), ...(BALLIMAL_IMAGE_URLS[s] || {}) }
  const themeKey = `${s}__${colorTheme}`
  const themed = BALLIMAL_IMAGE_URLS[themeKey]
  if (themed && typeof themed === 'object') {
    return { ...base, ...themed }
  }
  return base
}
