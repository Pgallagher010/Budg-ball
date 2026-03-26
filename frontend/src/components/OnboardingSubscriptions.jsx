import { useState } from 'react'
import { apiFetch } from '../api/client.js'
import './Onboarding.css'

function emptyRow() {
  return { name: '', monthlyAmount: '' }
}

export function OnboardingSubscriptions({
  authMode,
  idToken,
  devUserId,
  onDone,
}) {
  const auth = { authMode, idToken, devUserId }
  const [rows, setRows] = useState([emptyRow(), emptyRow()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const addRow = () => setRows((r) => [...r, emptyRow()])

  const updateRow = (i, field, value) => {
    setRows((prev) =>
      prev.map((row, j) => (j === i ? { ...row, [field]: value } : row))
    )
  }

  const removeRow = (i) => setRows((prev) => prev.filter((_, j) => j !== i))

  const persistAndContinue = async (items) => {
    setBusy(true)
    try {
      const res = await apiFetch('/api/subscriptions', {
        ...auth,
        method: 'POST',
        body: JSON.stringify({ items }),
      })
      if (!res.ok || !res.body?.success) {
        if (res.status === 401) {
          setError(
            'Unauthorized (401). For “Continue without Firebase”, start the backend in dev mode: set ALLOW_DEV_AUTH=true (or leave it unset in development) and restart the backend.'
          )
          return
        }
        setError(
          res.body?.error?.message ||
            'Could not save subscriptions. Is the backend running?'
        )
        return
      }

      const total = items.reduce((s, x) => s + x.monthlyAmount, 0)
      if (total > 0) {
        const monthKey = new Date().toISOString().slice(0, 7)
        await apiFetch('/api/budgets', {
          ...auth,
          method: 'POST',
          body: JSON.stringify({
            monthKey,
            category: 'subscriptions',
            limitAmount: total,
          }),
        })
      }

      onDone()
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const handleContinue = async () => {
    setError('')
    const items = rows
      .map((r) => ({
        name: r.name.trim(),
        monthlyAmount: parseFloat(r.monthlyAmount),
      }))
      .filter((r) => r.name && !Number.isNaN(r.monthlyAmount) && r.monthlyAmount > 0)

    await persistAndContinue(items)
  }

  const handleSkip = async () => {
    setError('')
    await persistAndContinue([])
  }

  return (
    <div className="onboarding">
      <div className="onboarding__top">
        <h1 className="onboarding__title">Your subscriptions</h1>
        <p className="onboarding__subtitle">
          Add the recurring subscriptions you pay each month (streaming, gym, phone, etc.).
          You can add more later from the app.
        </p>
      </div>

      <div className="onboarding__card">
        <h3>Monthly costs</h3>
        <div className="onboarding__row--head" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 36px', gap: '0.5rem' }}>
          <span>Name</span>
          <span>€ / month</span>
          <span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="onboarding__row">
            <input
              value={row.name}
              onChange={(e) => updateRow(i, 'name', e.target.value)}
              placeholder="e.g. Netflix"
              aria-label={`Subscription ${i + 1} name`}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.monthlyAmount}
              onChange={(e) => updateRow(i, 'monthlyAmount', e.target.value)}
              placeholder="0"
              aria-label={`Subscription ${i + 1} amount`}
            />
            <button
              type="button"
              className="onboarding__remove"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
              aria-label="Remove row"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="onboarding__btn onboarding__btn--ghost" onClick={addRow}>
          + Add another
        </button>
        {error && <p className="onboarding__error">{error}</p>}
        <p className="onboarding__hint">
          Leave rows blank or remove extras if you don&apos;t have that many. Continue saves your
          list and sets a <strong>subscriptions</strong> budget for this month (sum of amounts).
        </p>
      </div>

      <div className="onboarding__actions">
        <button
          type="button"
          className="onboarding__btn onboarding__btn--primary"
          disabled={busy}
          onClick={handleContinue}
        >
          Continue
        </button>
        <button
          type="button"
          className="onboarding__btn onboarding__btn--ghost"
          disabled={busy}
          onClick={handleSkip}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
