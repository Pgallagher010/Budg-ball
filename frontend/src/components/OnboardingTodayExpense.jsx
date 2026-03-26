import { useMemo, useState } from 'react'
import { apiFetch } from '../api/client.js'
import './Onboarding.css'

const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'books', label: 'Books' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'other', label: 'Other' },
]

export function OnboardingTodayExpense({
  authMode,
  idToken,
  devUserId,
  onDone,
  onSkip,
}) {
  const auth = { authMode, idToken, devUserId }
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [category, setCategory] = useState('food')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const amount = parseFloat(price)
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid price greater than zero.')
      return
    }
    setBusy(true)
    try {
      const res = await apiFetch('/api/expenses', {
        ...auth,
        method: 'POST',
        body: JSON.stringify({
          amount,
          category,
          date: today,
          description: description.trim() || undefined,
        }),
      })
      if (!res.ok || !res.body?.success) {
        if (res.status === 401) {
          setError(
            'Unauthorized (401). For “Continue without Firebase”, start the backend in dev mode: set ALLOW_DEV_AUTH=true (or leave it unset in development) and restart the backend.'
          )
          setBusy(false)
          return
        }
        setError(
          res.body?.error?.message ||
            'Could not save expense. Is the backend running with ALLOW_DEV_AUTH=true?'
        )
        setBusy(false)
        return
      }
      onDone()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__top">
        <h1 className="onboarding__title">Something you bought today?</h1>
        <p className="onboarding__subtitle">
          Log a purchase from <strong>{today}</strong> so your dashboard and ballimal stay in
          sync.
        </p>
      </div>

      <form className="onboarding__card" onSubmit={handleSubmit}>
        <h3>Today&apos;s expense</h3>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch at campus café"
            maxLength={200}
          />
        </label>
        <label>
          Price (€)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </label>
        {error && <p className="onboarding__error">{error}</p>}
        <div className="onboarding__actions" style={{ marginTop: '1rem' }}>
          <button type="submit" className="onboarding__btn onboarding__btn--primary" disabled={busy}>
            Save &amp; go to dashboard
          </button>
          <button
            type="button"
            className="onboarding__btn onboarding__btn--ghost"
            onClick={onSkip}
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  )
}
