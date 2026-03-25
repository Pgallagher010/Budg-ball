const PREFIX = 'budgball_onboarding_done_'

export function onboardingKeyForUser(userKey) {
  return `${PREFIX}${userKey}`
}

export function isOnboardingComplete(userKey) {
  if (!userKey || typeof window === 'undefined') return true
  return window.localStorage.getItem(onboardingKeyForUser(userKey)) === '1'
}

export function markOnboardingComplete(userKey) {
  if (!userKey || typeof window === 'undefined') return
  window.localStorage.setItem(onboardingKeyForUser(userKey), '1')
}
