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
import { BallimalAvatar } from './BallimalAvatar.jsx'
import { Sidebar } from './Sidebar.jsx'
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

function StatBar({ label, value, tone }) {
  const v = Math.max(0, Math.min(100, Number(value ?? 0)))
  const pct = `${v}%`
  return (
    <div className={`dash-stat ${tone || ''}`}>
      <div className="dash-stat__top">
        <span>{label}</span>
        <strong>{Math.round(v)}</strong>
      </div>
      <div className="dash-stat__track">
        <div className="dash-stat__fill" style={{ width: pct }} />
      </div>
    </div>
  )
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
  const THEME_BG = useMemo(
    () => ({
      sand: '#4a90d9',
      orange: '#f59e0b',
      pink: '#ec4899',
      mint: '#10b981',
      lavender: '#8b5cf6',
      slate: '#64748b',
    }),
    []
  )

  const THEME_LABEL = useMemo(
    () => ({
      sand: 'Blue',
      orange: 'Orange',
      pink: 'Pink',
      mint: 'Green',
      lavender: 'Purple',
      slate: 'Grey',
    }),
    []
  )
  const monthKey = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const [section, setSection] = useState('Home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [summary, setSummary] = useState(null)
  const [budgetPayload, setBudgetPayload] = useState(null)
  const [expensesPayload, setExpensesPayload] = useState(null)
  const [goalsPayload, setGoalsPayload] = useState(null)
  const [coins, setCoins] = useState(0)
  const [ballimal, setBallimal] = useState({ health: 70, happiness: 70, hunger: 70, cleanliness: 70 })
  const [unlocks, setUnlocks] = useState({ species: ['cat'], colorThemes: ['sand'] })
  const [preferences, setPreferences] = useState({
    species: 'cat',
    colorTheme: 'sand',
    weeklyBudget: 120,
  })
  const [prefSaving, setPrefSaving] = useState(false)
  const [quickExpense, setQuickExpense] = useState({
    amount: 5,
    category: 'food',
    description: '',
  })
  const [quickExpenseSaving, setQuickExpenseSaving] = useState(false)
  const [deletingExpenseId, setDeletingExpenseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [weeklyClaimMsg, setWeeklyClaimMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    const auth = { authMode, idToken, devUserId }
    try {
      const [me, sum, bud, exp, goals] = await Promise.all([
        apiFetch('/api/users/me', auth),
        apiFetch(`/api/dashboard/summary?monthKey=${encodeURIComponent(monthKey)}`, auth),
        apiFetch(`/api/budgets?monthKey=${encodeURIComponent(monthKey)}`, auth),
        apiFetch(`/api/expenses?monthKey=${encodeURIComponent(monthKey)}`, auth),
        apiFetch('/api/goals', auth),
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
      if (goals.ok && goals.body?.success) setGoalsPayload(goals.body.data)
      if (me.ok && me.body?.success && me.body.data?.preferences) {
        setPreferences((p) => ({
          ...p,
          ...me.body.data.preferences,
        }))
      }
      if (me.ok && me.body?.success) {
        setCoins(me.body.data?.ballimal?.coins || 0)
        if (me.body.data?.ballimal) {
          setBallimal((b) => ({ ...b, ...me.body.data.ballimal }))
        }
        if (me.body.data?.unlocks) setUnlocks(me.body.data.unlocks)
      }

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

  const expensesSorted = useMemo(() => {
    const list = expensesPayload?.expenses || []
    return [...list].sort((a, b) => {
      const byDate = (b.date || '').localeCompare(a.date || '')
      if (byDate !== 0) return byDate
      return (b.createdAt || '').localeCompare(a.createdAt || '')
    })
  }, [expensesPayload])

  const budgets = budgetPayload?.budgets || []
  const totalLimit = budgetPayload?.totalBudget ?? 0
  const totalUsed = budgetPayload?.totalUsed ?? 0
  const remaining = budgetPayload?.remainingBudget ?? totalLimit - totalUsed

  const spentThisWeek = useMemo(() => {
    const expenses = expensesPayload?.expenses || []
    if (!expenses.length) return 0
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 6) // inclusive 7 days window: today + previous 6 days
    const startIso = weekAgo.toISOString().slice(0, 10)
    const endIso = today.toISOString().slice(0, 10)
    return expenses.reduce((sum, e) => {
      const d = e.date?.slice(0, 10)
      if (!d) return sum
      return d >= startIso && d <= endIso ? sum + e.amount : sum
    }, 0)
  }, [expensesPayload])
  const weeklyBudgetOver = preferences.weeklyBudget > 0 && spentThisWeek > preferences.weeklyBudget

  const todaySpent = expensesPayload?.expenses?.reduce((s, e) => {
    const d = e.date?.slice(0, 10)
    const t = new Date().toISOString().slice(0, 10)
    return d === t ? s + e.amount : s
  }, 0) ?? 60
  const todayOther = 0

  const handleSignOut = async () => {
    try {
      const auth = getFirebaseAuth()
      if (auth) await signOut(auth)
    } finally {
      onSignedOut()
    }
  }

  const savePreferences = async () => {
    setPrefSaving(true)
    try {
      const auth = { authMode, idToken, devUserId }
      const payload = {
        species: preferences.species,
        colorTheme: preferences.colorTheme,
        weeklyBudget: Number(preferences.weeklyBudget) || 0,
      }
      const res = await apiFetch('/api/users/me/preferences', {
        ...auth,
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!res.ok || !res.body?.success) {
        setErr(res.body?.error?.message || 'Could not save BudgBall customisation.')
      }
      if (res.ok && res.body?.success) {
        setCoins(res.body.data?.ballimal?.coins || coins)
        if (res.body.data?.unlocks) setUnlocks(res.body.data.unlocks)
      }
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setPrefSaving(false)
    }
  }

  const claimWeekly = async () => {
    try {
      setWeeklyClaimMsg('')
      const auth = { authMode, idToken, devUserId }
      const res = await apiFetch('/api/rewards/weekly-claim', { ...auth, method: 'POST' })
      if (!res.ok || !res.body?.success) {
        // Keep this message local so it doesn't persist across menus.
        setWeeklyClaimMsg(res.body?.error?.message || 'Could not claim weekly coins.')
        return
      }
      setCoins(res.body.data?.user?.ballimal?.coins || coins)
      const met = res.body.data?.met
      const rewardCoins = res.body.data?.rewardCoins ?? 0
      setWeeklyClaimMsg(met ? `Claimed +${rewardCoins} coins!` : 'Weekly goal not met (0 coins).')
      await load()
    } catch (e) {
      setWeeklyClaimMsg(String(e.message || e))
    }
  }

  const remainingMonth = summary?.remainingBudget ?? budgetPayload?.remainingBudget ?? 0

  const saveMonthlyBudgets = async (budgetsByCategory) => {
    const auth = { authMode, idToken, devUserId }
    const entries = Object.entries(budgetsByCategory)
    for (const [category, limitAmount] of entries) {
      const v = Number(limitAmount || 0)
      if (v > 0) {
        // eslint-disable-next-line no-await-in-loop
        await apiFetch('/api/budgets', {
          ...auth,
          method: 'POST',
          body: JSON.stringify({ monthKey, category, limitAmount: v }),
        })
      }
    }
    await load()
  }

  const giveUpGoal = async (goalId) => {
    const auth = { authMode, idToken, devUserId }
    await apiFetch(`/api/goals/${encodeURIComponent(goalId)}`, {
      ...auth,
      method: 'PATCH',
      body: JSON.stringify({ status: 'failed' }),
    })
    await load()
  }

  const completeGoalById = async (goalId) => {
    const auth = { authMode, idToken, devUserId }
    await apiFetch(`/api/goals/${encodeURIComponent(goalId)}/complete`, {
      ...auth,
      method: 'POST',
    })
    await load()
  }

  const createGoalQuick = async ({ type, targetAmount }) => {
    const auth = { authMode, idToken, devUserId }
    const start = `${monthKey}-01`
    const end = `${monthKey}-28`
    await apiFetch('/api/goals', {
      ...auth,
      method: 'POST',
      body: JSON.stringify({ type, targetAmount, periodStart: start, periodEnd: end }),
    })
    await load()
  }

  const addExpenseToday = async ({ amount, category, description }) => {
    const auth = { authMode, idToken, devUserId }
    const date = new Date().toISOString().slice(0, 10)
    await apiFetch('/api/expenses', {
      ...auth,
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount), category, date, description: description || undefined }),
    })
    await load()
  }

  const removeExpense = async (expenseId) => {
    setDeletingExpenseId(expenseId)
    try {
      const auth = { authMode, idToken, devUserId }
      const res = await apiFetch(`/api/expenses/${encodeURIComponent(expenseId)}`, {
        ...auth,
        method: 'DELETE',
      })
      if (!res.ok || !res.body?.success) {
        setErr(res.body?.error?.message || 'Could not delete expense.')
        return
      }
      if (res.body.data?.ballimal?.coins != null) setCoins(res.body.data.ballimal.coins)
      setErr('')
      await load()
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setDeletingExpenseId('')
    }
  }

  const submitQuickExpense = async () => {
    setQuickExpenseSaving(true)
    try {
      await addExpenseToday(quickExpense)
      setQuickExpense((p) => ({ ...p, description: '' }))
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      setQuickExpenseSaving(false)
    }
  }

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const goals = goalsPayload?.goals || []

  const canUseSpecies = (s) => unlocks?.species?.includes(s)
  const canUseColor = (c) => unlocks?.colorThemes?.includes(c)

  return (
    <div className="dashboard">
      <div className={`dash-layout ${sidebarOpen ? 'menu-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar
          active={section}
          onSelect={(s) => {
            setSection(s)
            setErr('')
            setWeeklyClaimMsg('')
            setSidebarOpen(false)
          }}
          balanceAmount={remainingMonth}
          coins={coins}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onSignOut={handleSignOut}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {sidebarOpen && <div className="dash-backdrop" onClick={() => setSidebarOpen(false)} />}

        <div className="dash-main">
          <header className="dash-header" style={{ background: THEME_BG[preferences.colorTheme] || '#e8f4fc' }}>
            <div className="dash-header__row">
              <button type="button" className="dash-menu" onClick={() => setSidebarOpen(true)}>
                ☰
              </button>
              <div className="dash-header__mascot">
                <BallimalAvatar
                  species={preferences.species}
                  colorTheme={preferences.colorTheme}
                  health={ballimal.health}
                  happiness={ballimal.happiness}
                />
              </div>
              <div className="dash-header__spacer" />
            </div>
            <div className="dash-header__bar" />
            <div className="dash-header__stats">
              <StatBar label="Health" value={ballimal.health} tone="health" />
              <StatBar label="Happiness" value={ballimal.happiness} tone="happy" />
              <StatBar label="Hunger" value={ballimal.hunger} tone="hunger" />
              <StatBar label="Clean" value={ballimal.cleanliness} tone="clean" />
            </div>
          </header>

          <main className="dash-body">
        <div className="dash-top-actions">
          <span className="dash-greeting">Hi, {displayName || 'there'}</span>
        </div>
        {loading && <p className="dash-loading">Loading…</p>}
        {err && <p className="dash-err">{err}</p>}

        {section === 'Home' && (
          <>
        <section className="dash-card dash-section dash-section--quick-expense">
          <div className="dash-quick-expense__title">Log expenditure</div>
          <div className="dash-quick-expense__grid">
            <label>
              Amount (€)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quickExpense.amount}
                onChange={(e) =>
                  setQuickExpense((p) => ({ ...p, amount: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              Category
              <select
                value={quickExpense.category}
                onChange={(e) =>
                  setQuickExpense((p) => ({ ...p, category: e.target.value }))
                }
              >
                <option value="food">food</option>
                <option value="transport">transport</option>
                <option value="entertainment">entertainment</option>
                <option value="books">books</option>
                <option value="subscriptions">subscriptions</option>
                <option value="other">other</option>
              </select>
            </label>
            <label className="dash-quick-expense__desc">
              Description
              <input
                value={quickExpense.description}
                onChange={(e) =>
                  setQuickExpense((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Optional"
              />
            </label>
          </div>
          <button
            type="button"
            className="dash-quick-expense__btn"
            onClick={submitQuickExpense}
            disabled={loading || quickExpenseSaving}
          >
            {quickExpenseSaving ? 'Saving…' : 'Add'}
          </button>
        </section>

        <section className="dash-card dash-section dash-section--recent-expenses">
          <div className="dash-card__title-row">
            <h2 className="dash-card__title">This month</h2>
            <span className="muted" style={{ fontSize: '0.75rem' }}>
              Remove duplicates
            </span>
          </div>
          <div className="dash-list">
            {expensesSorted.length === 0 && <p className="muted">No expenses logged yet this month.</p>}
            {expensesSorted.slice(0, 12).map((e) => (
              <div key={e.id} className="dash-list__row">
                <div>
                  <div className="dash-list__title">
                    {formatEuro(e.amount)} · {CATEGORY_LABELS[e.category] || e.category}
                  </div>
                  <div className="muted">{e.description || '—'} · {e.date}</div>
                </div>
                <div className="dash-list__actions">
                  <button
                    type="button"
                    className="dash-expense-delete"
                    onClick={() => removeExpense(e.id)}
                    disabled={loading || deletingExpenseId === e.id}
                  >
                    {deletingExpenseId === e.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-card dash-card--wide dash-section dash-section--today">
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

        <div className="dash-grid-2 dash-section dash-section--stats">
          <section className="dash-card">
            <div className="dash-card__title-row">
              <h2 className="dash-card__title">Spent this week</h2>
              <a className="dash-link" href="#top">
                View
              </a>
            </div>
            <div className="dash-huge">{formatEuro(spentThisWeek || 0)}</div>
            <p className="dash-sub muted">
              Budget: {formatEuro(preferences.weeklyBudget || 0)} · Last 7 days (including today)
            </p>
            {weeklyBudgetOver && (
              <p className="dash-sub dash-warning">Over weekly budget — your BudgBall is sad.</p>
            )}
            <div className="dash-weekly-row">
              <div className="dash-weekly-coins">Coins: {coins}</div>
              <button type="button" className="dash-weekly-claim" onClick={claimWeekly} disabled={loading}>
                Claim weekly coins
              </button>
            </div>
            {weeklyClaimMsg && <p className="dash-sub muted">{weeklyClaimMsg}</p>}
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

        <section className="dash-card dash-section dash-section--weekly-goal">
          <div className="dash-card__title-row">
            <h2 className="dash-card__title">Weekly budget goal</h2>
          </div>
          <div className="dash-custom-grid">
            <label>
              Weekly budget (€)
              <input
                type="number"
                min="0"
                step="0.01"
                value={preferences.weeklyBudget}
                onChange={(e) => setPreferences((p) => ({ ...p, weeklyBudget: Number(e.target.value) }))}
              />
            </label>
          </div>
          <button type="button" className="dash-save-prefs" onClick={savePreferences} disabled={prefSaving}>
            {prefSaving ? 'Saving...' : 'Save weekly goal'}
          </button>
          <p className="muted" style={{ marginTop: '0.4rem' }}>
            This controls your “Spent this week” budget and whether the BudgBall looks sad.
          </p>
        </section>

        <section className="dash-card dash-section dash-section--budget">
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

        <button type="button" className="dash-refresh dash-section dash-section--refresh" onClick={load} disabled={loading}>
          Refresh data
        </button>
          </>
        )}

        {section === 'Goals' && (
          <GoalsSection
            goals={goals}
            onCreate={createGoalQuick}
            onGiveUp={giveUpGoal}
            onComplete={completeGoalById}
            loading={loading}
          />
        )}

        {section === 'Monthly Budget' && (
          <MonthlyBudgetSection
            monthKey={monthKey}
            existingBudgets={budgets}
            onSave={saveMonthlyBudgets}
            loading={loading}
          />
        )}

        {section === 'Spending Overview' && (
          <SpendingOverviewSection
            expenses={expensesPayload?.expenses || []}
            onAddExpense={addExpenseToday}
            onDeleteExpense={removeExpense}
            deletingExpenseId={deletingExpenseId}
            loading={loading}
          />
        )}

        {section === 'Shop' && (
          <>
            <section className="dash-card dash-section dash-section--custom">
              <div className="dash-card__title-row">
                <h2 className="dash-card__title">BudgBall customisation</h2>
              </div>
              <div className="dash-custom-grid">
                <label>
                  Animal
                  <select
                    value={preferences.species}
                    onChange={(e) => setPreferences((p) => ({ ...p, species: e.target.value }))}
                  >
                    <option value="cat">Cat</option>
                    <option value="fox" disabled={!canUseSpecies('fox')}>Fox {canUseSpecies('fox') ? '' : '🔒'}</option>
                    <option value="panda" disabled={!canUseSpecies('panda')}>Panda {canUseSpecies('panda') ? '' : '🔒'}</option>
                    <option value="monkey" disabled={!canUseSpecies('monkey')}>Monkey {canUseSpecies('monkey') ? '' : '🔒'}</option>
                  </select>
                </label>
                <label>
                  Background
                  <select
                    value={preferences.colorTheme}
                    onChange={(e) => setPreferences((p) => ({ ...p, colorTheme: e.target.value }))}
                  >
                    <option value="sand">{THEME_LABEL.sand}</option>
                    <option value="orange" disabled={!canUseColor('orange')}>
                      {THEME_LABEL.orange} {canUseColor('orange') ? '' : '🔒'}
                    </option>
                    <option value="pink" disabled={!canUseColor('pink')}>
                      {THEME_LABEL.pink} {canUseColor('pink') ? '' : '🔒'}
                    </option>
                    <option value="mint" disabled={!canUseColor('mint')}>
                      {THEME_LABEL.mint} {canUseColor('mint') ? '' : '🔒'}
                    </option>
                    <option value="lavender" disabled={!canUseColor('lavender')}>
                      {THEME_LABEL.lavender} {canUseColor('lavender') ? '' : '🔒'}
                    </option>
                    <option value="slate" disabled={!canUseColor('slate')}>
                      {THEME_LABEL.slate} {canUseColor('slate') ? '' : '🔒'}
                    </option>
                  </select>
                </label>
              </div>
              <button type="button" className="dash-save-prefs" onClick={savePreferences} disabled={prefSaving}>
                {prefSaving ? 'Saving...' : 'Save customisation'}
              </button>
              <p className="muted" style={{ marginTop: '0.4rem' }}>
                Unlock more animals/backgrounds below using coins.
              </p>
            </section>

            <ShopSection
              authMode={authMode}
              idToken={idToken}
              devUserId={devUserId}
              coins={coins}
              onBought={(user) => {
                setCoins(user?.ballimal?.coins || 0)
                if (user?.ballimal) setBallimal((b) => ({ ...b, ...user.ballimal }))
                if (user?.unlocks) setUnlocks(user.unlocks)
              }}
              loading={loading}
            />
          </>
        )}
      </main>
        </div>
      </div>
    </div>
  )
}

function ShopSection({ authMode, idToken, devUserId, coins, onBought, loading }) {
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  const [busySku, setBusySku] = useState('')
  const [granting, setGranting] = useState(false)

  const loadShop = useCallback(async () => {
    const auth = { authMode, idToken, devUserId }
    const res = await apiFetch('/api/shop', auth)
    if (!res.ok || !res.body?.success) {
      setErr(res.body?.error?.message || 'Could not load shop.')
      return
    }
    setItems(res.body.data.items || [])
    setErr('')
  }, [authMode, idToken, devUserId])

  useEffect(() => {
    loadShop()
  }, [loadShop])

  const buy = async (sku) => {
    setBusySku(sku)
    try {
      const auth = { authMode, idToken, devUserId }
      const res = await apiFetch('/api/shop/purchase', {
        ...auth,
        method: 'POST',
        body: JSON.stringify({ sku }),
      })
      if (!res.ok || !res.body?.success) {
        setErr(res.body?.error?.message || 'Purchase failed.')
        return
      }
      const user = res.body.data.user
      onBought(user)
      setErr('')
      await loadShop()
    } finally {
      setBusySku('')
    }
  }

  const grantTestCoins = async () => {
    setGranting(true)
    try {
      const auth = { authMode, idToken, devUserId }
      const res = await apiFetch('/api/dev/coins', {
        ...auth,
        method: 'POST',
        body: JSON.stringify({ coins: 1000 }),
      })
      if (!res.ok || !res.body?.success) {
        setErr(res.body?.error?.message || 'Could not grant test coins.')
        return
      }
      onBought(res.body.data)
      setErr('')
      await loadShop()
    } finally {
      setGranting(false)
    }
  }

  return (
    <section className="dash-card dash-section dash-section--shop">
      <div className="dash-card__title-row">
        <h2 className="dash-card__title">Shop</h2>
        <span className="dash-pill">Coins: {coins}</span>
      </div>
      {err && <p className="dash-err" style={{ color: '#fff' }}>{err}</p>}
      {authMode === 'dev' && (
        <button type="button" className="dash-save-prefs" onClick={grantTestCoins} disabled={loading || granting}>
          {granting ? 'Granting…' : 'Dev: Set my coins to 1000'}
        </button>
      )}
      <div className="dash-shop-grid">
        {items.map((it) => (
          <div key={it.sku} className="dash-shop-item">
            <div>
              <div className="dash-list__title">{it.name}</div>
              <div className="muted">{it.type} · cost {it.cost} coins</div>
            </div>
            <button
              type="button"
              onClick={() => buy(it.sku)}
              disabled={loading || it.owned || busySku === it.sku}
            >
              {it.owned ? 'Owned' : busySku === it.sku ? 'Buying…' : 'Buy'}
            </button>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: '0.6rem' }}>
        Earn coins weekly by staying under your weekly spend goal.
      </p>
    </section>
  )
}

function GoalsSection({ goals, onCreate, onGiveUp, onComplete, loading }) {
  const [type, setType] = useState('daily')
  const [amount, setAmount] = useState(5)
  return (
    <section className="dash-card dash-section dash-section--full">
      <div className="dash-card__title-row">
        <h2 className="dash-card__title">Goals</h2>
      </div>
      <div className="dash-custom-grid">
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label>
          Target (€)
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
      </div>
      <button className="dash-save-prefs" type="button" disabled={loading} onClick={() => onCreate({ type, targetAmount: Number(amount) })}>
        Create goal
      </button>

      <div className="dash-list">
        {goals.length === 0 && <p className="muted">No goals yet.</p>}
        {goals.map((g) => (
          <div key={g.id} className="dash-list__row">
            <div>
              <div className="dash-list__title">{g.type.toUpperCase()} goal</div>
              <div className="muted">
                Target {formatEuro(g.targetAmount)} · Progress {formatEuro(g.progressAmount || 0)} · {g.status}
              </div>
            </div>
            <div className="dash-list__actions">
              <button type="button" onClick={() => onComplete(g.id)} disabled={loading || g.status === 'completed'}>
                Complete
              </button>
              <button type="button" onClick={() => onGiveUp(g.id)} disabled={loading || g.status !== 'active'}>
                Give up
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MonthlyBudgetSection({ monthKey, existingBudgets, onSave, loading }) {
  const categories = ['food', 'transport', 'entertainment', 'books', 'subscriptions', 'other']
  const initial = Object.fromEntries(categories.map((c) => [c, 0]))
  for (const b of existingBudgets) initial[b.category] = b.limitAmount
  const [inputs, setInputs] = useState(initial)

  return (
    <section className="dash-card dash-section dash-section--full">
      <div className="dash-card__title-row">
        <h2 className="dash-card__title">Monthly Budget</h2>
        <span className="dash-pill">{monthKey}</span>
      </div>

      <div className="dash-budget-grid">
        {categories.map((c) => (
          <label key={c}>
            {c}
            <input
              type="number"
              min="0"
              step="0.01"
              value={inputs[c]}
              onChange={(e) => setInputs((p) => ({ ...p, [c]: Number(e.target.value) }))}
            />
          </label>
        ))}
      </div>
      <button className="dash-save-prefs" type="button" disabled={loading} onClick={() => onSave(inputs)}>
        Save monthly budgets
      </button>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Budgets are saved per category for the current month.
      </p>
    </section>
  )
}

function SpendingOverviewSection({ expenses, onAddExpense, onDeleteExpense, deletingExpenseId, loading }) {
  const [category, setCategory] = useState('food')
  const [amount, setAmount] = useState(5)
  const [desc, setDesc] = useState('')

  return (
    <section className="dash-card dash-section dash-section--full">
      <div className="dash-card__title-row">
        <h2 className="dash-card__title">Spending Overview</h2>
      </div>

      <div className="dash-custom-grid">
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="food">food</option>
            <option value="transport">transport</option>
            <option value="entertainment">entertainment</option>
            <option value="books">books</option>
            <option value="subscriptions">subscriptions</option>
            <option value="other">other</option>
          </select>
        </label>
        <label>
          Amount (€)
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          Description
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
        </label>
      </div>
      <button className="dash-save-prefs" type="button" disabled={loading} onClick={() => onAddExpense({ amount, category, description: desc })}>
        Add expense (today)
      </button>

      <div className="dash-list">
        {expenses.length === 0 && <p className="muted">No expenses logged this month.</p>}
        {expenses.map((e) => (
          <div key={e.id} className="dash-list__row">
            <div>
              <div className="dash-list__title">{formatEuro(e.amount)} · {e.category}</div>
              <div className="muted">{e.description || '—'} · {e.date}</div>
            </div>
            <div className="dash-list__actions">
              <button
                type="button"
                className="dash-expense-delete"
                onClick={() => onDeleteExpense(e.id)}
                disabled={loading || deletingExpenseId === e.id}
              >
                {deletingExpenseId === e.id ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
