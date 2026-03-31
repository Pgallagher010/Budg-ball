import './Sidebar.css'

const MENU = ['Home', 'Goals', 'Monthly Budget', 'Spending Overview', 'Shop']

export function Sidebar({
  active,
  onSelect,
  balanceAmount = 0,
  coins = 0,
  collapsed = false,
  onToggleCollapsed,
  onSignOut,
  isOpen = true,
  onClose,
}) {
  if (collapsed) {
    return (
      <aside className="sidebar sidebar--folded" aria-label="Sidebar collapsed">
        <button
          type="button"
          className="sidebar__expand"
          onClick={onToggleCollapsed}
          aria-label="Expand sidebar"
          title="Expand menu"
        >
          »
        </button>
      </aside>
    )
  }

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar__top">
        <h2 className="sidebar__title">Dashboard</h2>
        <button
          type="button"
          className="sidebar__collapse"
          onClick={onToggleCollapsed}
          aria-label="Collapse sidebar"
          title="Collapse"
        >
          «
        </button>
        <button
          type="button"
          className="sidebar__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      <nav className="sidebar__nav">
        <ul>
          {MENU.map((item) => (
            <li key={item}>
              <button
                type="button"
                className={`sidebar__item ${active === item ? 'active' : ''}`}
                onClick={() => onSelect(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__balance">
        <div className="sidebar__balance-label">EUR Balance</div>
        <div className="sidebar__balance-value">
          € {Number(balanceAmount || 0).toFixed(2)}
        </div>
        <div className="sidebar__balance-hint">Remaining budget this month</div>
        <div className="sidebar__coins">
          <span>Coins</span>
          <strong>{coins}</strong>
        </div>
        <button type="button" className="sidebar__signout" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
