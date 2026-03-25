import { useCallback, useEffect, useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiFetch } from '../api/client.js'
import { getFirebaseAuth } from '../firebase.js'
import { BallimalCat } from './BallimalCat.jsx'
import './Dashboard.css'

const DONUT_COLORS = ['#26c6da', '#ff9800', '#ffeb3b', '#e91e63', '#7e57c2', '#78909c']

const CATEGORY_LABELS = {
  food: 'Food & dining',
  transport: 'Auto & transport',
  entertainment: 'Entertainment',
  books: 'Books',
  subscriptions: 'Subscriptions',
  other: 'Other',
}

function formatEuro(n) {
  if (n == null || Number.isNaN(n)) return '€0.00'
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(n)
}

function monthAbbrev(monthKey) {
  if (!monthKey || monthKey.length < 7) return '—'
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleString('en', { month: 'short' }).toUpperCase()
}

/** Mock 24h stepped line similar to analytics dashboards */
const TODAY_LINE = [
  { t: '00:00', v: 5 },
  { t: '04:00', v: 5 },
  { t: '08:00', v: 18 },
  { t: '12:00', v: 35 },
  { t: '16:00', v: 48 },
  { t: '20:00', v: 55 },
  { t: '23:59', v: 60 },
]

function BudgetRow({ title, subtitle, spent, limit }) {
  const left = limit - spent
  const over = left < 0
  const ratioRaw = limit > 0 ? spent / limit : 0
  const barPct = over ? 100 : Math.min(100, Math.max(0, ratioRaw * 100))
  const warn = !over && ratioRaw >= 0.8
  let barClass = 'dash-progress__fill'
  if (over) barClass += ' dash-progress__fill--over'
  else if (warn) barClass += ' dash-progress__fill--warn'

  return (
    <div className="dash-budget-row">
      <div className="dash-budget-row__head">
        <span className="dash-budget-row__title">{title}</span>
        <button type="button" className="dash-budget-row__edit" aria-label="Edit">
          ✎
        </button>
      </div>
      {subtitle && <div className="dash-budget-row__sub">{subtitle}</div>}
      <div className="dash-budget-row__meta">
        <span className={over ? 'over' : ''}>
          {over
            ? `${formatEuro(Math.abs(left))} over`
            : `${formatEuro(Math.max(0, left))} left`}
        </span>
        <span className="muted">
          {formatEuro(spent)} of {formatEuro(limit)}
        </span>
      </div>
      <div className="dash-progress">
        <div className={barClass} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  )
}

export function Dashboard({
  authMode,
  idToken,
  devUserId,
  displayName,
  seedUsername,
  onSignedOut,
}) {
  const monthKey = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const [summary, setSummary] = useState(null)
  const [budgetPayload, setBudgetPayload] = useState(null)
  const [expensesPayload, setExpensesPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    const auth = { authMode, idToken, devUserId }
    try {
      const [me, sum, bud, exp] = await Promise.all([
        apiFetch('/api/users/me', auth),
        apiFetch(`/api/dashboard/summary?monthKey=${encodeURIComponent(monthKey)}`, auth),
        apiFetch(`/api/budgets?monthKey=${encodeURIComponent(monthKey)}`, auth),
        apiFetch(`/api/expenses?monthKey=${encodeURIComponent(monthKey)}`, auth),
      ])

      if (!me.ok && me.status === 404) {
        const raw = (seedUsername || devUserId || 'user').toString()
        const safeUser =
          raw
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .slice(0, 30) || 'user'
        await apiFetch('/api/users/me', {
          ...auth,
          method: 'POST',
          body: JSON.stringify({
            username: safeUser,
            displayName: displayName || 'User',
          }),
        })
      }

      if (sum.ok && sum.body?.success) setSummary(sum.body.data)
      if (bud.ok && bud.body?.success) setBudgetPayload(bud.body.data)
      if (exp.ok && exp.body?.success) setExpensesPayload(exp.body.data)

      if (!sum.ok) {
        const hint =
          me.status === 401
            ? ' Got 401 — set ALLOW_DEV_AUTH=true in backend/.env and restart, or sign in with Firebase.'
            : ' Is the backend running on port 4000?'
        setErr(`Could not load dashboard.${hint}`)
      }
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }, [authMode, idToken, devUserId, displayName, seedUsername, monthKey])

  useEffect(() => {
    if (authMode === 'firebase' && !idToken) return
    load()
  }, [authMode, idToken, load])

  const donutData = useMemo(() => {
    const expenses = expensesPayload?.expenses || []
    const map = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount
    }
    const rows = Object.entries(map).map(([name, value]) => ({
      name: CATEGORY_LABELS[name] || name,
      value,
    }))
    if (rows.length) return rows
    return [
      { name: 'Food', value: 120 },
      { name: 'Transport', value: 80 },
      { name: 'Fun', value: 55 },
      { name: 'Other', value: 40 },
    ]
  }, [expensesPayload])

  const budgets = budgetPayload?.budgets || []
  const totalLimit = budgetPayload?.totalBudget ?? 0
  const totalUsed = budgetPayload?.totalUsed ?? 0
  const remaining = budgetPayload?.remainingBudget ?? totalLimit - totalUsed

  const eurBalance =
    summary?.remainingBudget ?? remaining ?? 1243.62
  const instantHint = summary?.totalBudget
    ? `Available to save after budgets (${formatEuro(summary.remainingBudget ?? 0)} this month)`
    : 'Available to pay out (demo values if API empty)'

  const todaySpent = expensesPayload?.expenses?.reduce((s, e) => {
    const d = e.date?.slice(0, 10)
    const t = new Date().toISOString().slice(0, 10)
    return d === t ? s + e.amount : s
  }, 0) ?? 60
  const todayOther = 0

  const handleSignOut = async () => {
    const auth = getFirebaseAuth()
    if (auth) await signOut(auth)
    onSignedOut()
  }

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-header__mascot">
          <BallimalCat />
        </div>
        <div className="dash-header__bar" />
      </header>

      <main className="dash-body">
        <div className="dash-top-actions">
          <span className="dash-greeting">Hi, {displayName || 'there'}</span>
          <button type="button" className="dash-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
        {loading && <p className="dash-loading">Loading…</p>}
        {err && <p className="dash-err">{err}</p>}

        <section className="dash-card dash-card--wide">
          <div className="dash-card__title-row">
            <h2 className="dash-card__title">Today</h2>
          </div>
          <div className="dash-today-meta">
            <div>
              <span className="muted">Gross volume</span>
              <div className="dash-big">{formatEuro(todaySpent)}</div>
            </div>
            <div>
              <span className="muted">{dateLabel} ▾</span>
              <div className="dash-big dim">{formatEuro(todayOther)}</div>
            </div>
          </div>
          <div className="dash-chart-h">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={TODAY_LINE} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="#90caf9" />
                <YAxis hide domain={[0, 70]} />
                <Tooltip formatter={(v) => formatEuro(v)} />
                <Line
                  type="stepAfter"
                  dataKey="v"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="dash-grid-2">
          <section className="dash-card">
            <div className="dash-card__title-row">
              <h2 className="dash-card__title">EUR balance</h2>
              <a className="dash-link" href="#top">
                View
              </a>
            </div>
            <div className="dash-huge">{formatEuro(eurBalance)}</div>
            <p className="dash-sub muted">{instantHint}</p>
          </section>

          <section className="dash-card dash-card--chart">
            <h2 className="dash-card__title center">Spending</h2>
            <div className="dash-donut-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatEuro(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-donut-label">{monthAbbrev(monthKey)}</div>
            </div>
          </section>
        </div>

        <section className="dash-card">
          <div className="dash-card__title-row">
            <h2 className="dash-card__title">
              {new Date(monthKey + '-01').toLocaleString('en', { month: 'long', year: 'numeric' })}
            </h2>
            <span className="dash-pill">{formatEuro(remaining)} left</span>
          </div>
          <div className="dash-budget-row">
            <div className="dash-budget-row__head">
              <span className="dash-budget-row__title">Overall</span>
            </div>
            <div className="dash-budget-row__meta">
              <span>{formatEuro(Math.max(0, remaining))} left</span>
              <span className="muted">
                {formatEuro(totalUsed)} of {formatEuro(totalLimit || 742)}
              </span>
            </div>
            <div className="dash-progress">
              <div
                className="dash-progress__fill"
                style={{
                  width: `${totalLimit ? Math.min(100, (totalUsed / totalLimit) * 100) : 56}%`,
                }}
              />
            </div>
          </div>

          {budgets.length === 0 ? (
            <>
              <BudgetRow
                title="AUTO & TRANSPORT"
                subtitle="Gas & fuel"
                spent={236}
                limit={372}
              />
              <BudgetRow title="FOOD & DINING" subtitle="Alcohol & bars" spent={44} limit={20} />
              <BudgetRow title="FOOD & DINING" subtitle="Fast food" spent={47} limit={50} />
            </>
          ) : (
            budgets.map((b) => (
              <BudgetRow
                key={b.id || b.category}
                title={(CATEGORY_LABELS[b.category] || b.category).toUpperCase()}
                subtitle={b.category}
                spent={b.usedAmount || 0}
                limit={b.limitAmount}
              />
            ))
          )}
        </section>

        <button type="button" className="dash-refresh" onClick={load} disabled={loading}>
          Refresh data
        </button>
      </main>
    </div>
  )
}
