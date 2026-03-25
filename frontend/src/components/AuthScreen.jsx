import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseClientConfigured } from '../firebase.js'
import './AuthScreen.css'

export function AuthScreen({ onDevContinue, onFirebaseUser }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [devUsername, setDevUsername] = useState('test_user_1')
  const [devDisplayName, setDevDisplayName] = useState('Test User')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isFirebaseClientConfigured() || !getFirebaseAuth()) {
      setError('Add Firebase keys to .env.local, or use “Continue without Firebase”.')
      return
    }
    setBusy(true)
    try {
      const auth = getFirebaseAuth()
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password)
      }
      onFirebaseUser?.()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">Budg&apos;Ball</span>
          <p className="auth-tagline">Your savings, your ballimal.</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required={isFirebaseClientConfigured()}
              minLength={6}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-primary" disabled={busy}>
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-dev">
          <p className="auth-dev-title">Local demo (no Firebase)</p>
          <label>
            Username (sent as <code>x-dev-user-id</code>)
            <input
              value={devUsername}
              onChange={(e) => setDevUsername(e.target.value)}
            />
          </label>
          <label>
            Display name
            <input
              value={devDisplayName}
              onChange={(e) => setDevDisplayName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="auth-secondary"
            onClick={() =>
              onDevContinue({
                devUserId: devUsername.trim() || 'test_user_1',
                displayName: devDisplayName.trim() || 'Demo User',
              })
            }
          >
            Continue without Firebase
          </button>
          {!isFirebaseClientConfigured() && (
            <p className="auth-hint">
              Firebase is not configured — use the demo button or add{' '}
              <code>VITE_*</code> keys in <code>.env.local</code>.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
