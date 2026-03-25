import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth, isFirebaseClientConfigured } from './firebase.js'
import { markOnboardingComplete, isOnboardingComplete } from './lib/onboarding.js'
import { AuthScreen } from './components/AuthScreen.jsx'
import { Dashboard } from './components/Dashboard.jsx'
import { OnboardingSubscriptions } from './components/OnboardingSubscriptions.jsx'
import { OnboardingTodayExpense } from './components/OnboardingTodayExpense.jsx'
import './App.css'

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [devSession, setDevSession] = useState(null)
  /** 'subscriptions' | 'expense' | 'done' — only used when logged in */
  const [onboardingPhase, setOnboardingPhase] = useState('done')

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) return undefined
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        setDevSession(null)
        setIdToken(await user.getIdToken())
      } else {
        setIdToken(null)
      }
    })
  }, [])

  const loggedIn = Boolean(firebaseUser || devSession)

  const userKey = useMemo(
    () => firebaseUser?.uid ?? devSession?.devUserId ?? '',
    [firebaseUser, devSession]
  )

  useEffect(() => {
    if (!loggedIn || !userKey) {
      setOnboardingPhase('done')
      return
    }
    if (isOnboardingComplete(userKey)) {
      setOnboardingPhase('done')
    } else {
      setOnboardingPhase('subscriptions')
    }
  }, [loggedIn, userKey])

  const authMode = firebaseUser ? 'firebase' : 'dev'
  const devUserId = devSession?.devUserId ?? ''
  const displayName =
    devSession?.displayName ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    'there'

  const seedUsername = useMemo(() => {
    if (devSession?.devUserId) return devSession.devUserId
    const emailLocal = firebaseUser?.email?.split('@')[0]
    if (emailLocal) {
      let u = emailLocal.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
      u = u.replace(/^_|_$/g, '')
      if (u.length >= 3) return u.slice(0, 30)
    }
    const uid = firebaseUser?.uid || 'user'
    return `u_${uid.replace(/[^a-z0-9_]/gi, '_').slice(0, 24)}`.slice(0, 30)
  }, [devSession, firebaseUser])

  const handleDevContinue = ({ devUserId: uid, displayName: name }) => {
    setDevSession({ devUserId: uid, displayName: name })
  }

  const handleSignedOut = () => {
    setDevSession(null)
    setFirebaseUser(null)
    setIdToken(null)
    setOnboardingPhase('done')
  }

  const finishOnboarding = () => {
    markOnboardingComplete(userKey)
    setOnboardingPhase('done')
  }

  const authProps = {
    authMode,
    idToken,
    devUserId,
  }

  return (
    <div className="app-root">
      {!loggedIn && (
        <AuthScreen
          onDevContinue={handleDevContinue}
          onFirebaseUser={() => {}}
        />
      )}
      {loggedIn && onboardingPhase === 'subscriptions' && (
        <OnboardingSubscriptions
          {...authProps}
          onDone={() => setOnboardingPhase('expense')}
        />
      )}
      {loggedIn && onboardingPhase === 'expense' && (
        <OnboardingTodayExpense
          {...authProps}
          onDone={finishOnboarding}
          onSkip={finishOnboarding}
        />
      )}
      {loggedIn && onboardingPhase === 'done' && (
        <Dashboard
          authMode={authMode}
          idToken={idToken}
          devUserId={devUserId}
          displayName={displayName}
          seedUsername={seedUsername}
          onSignedOut={handleSignedOut}
        />
      )}
      {!loggedIn && isFirebaseClientConfigured() && (
        <p className="app-footnote">
          Firebase is configured — use Log in or Sign up above.
        </p>
      )}
    </div>
  )
}
