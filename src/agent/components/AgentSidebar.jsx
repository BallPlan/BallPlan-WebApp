import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Star, Settings, X, LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
import logoIcon from '../../assets/logo-icon.png';

const LINKS = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/venues', icon: Store, label: 'Venues' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AgentSidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const content = (isMobile) => (
    <>
      <div className={`flex items-center gap-2 px-2 ${collapsed && !isMobile ? 'justify-center' : ''}`}>
        <img src={logoIcon} alt="" className="h-8 w-auto shrink-0" />
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold leading-tight text-ink dark:text-white">BallPlan</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40 dark:text-white/40">Agent</p>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-full p-1.5 text-ink/50 hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {LINKS.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onCloseMobile}
            title={collapsed && !isMobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                collapsed && !isMobile ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-brand text-white'
                  : 'text-ink/60 hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {(!collapsed || isMobile) && label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/logout"
        onClick={onCloseMobile}
        title={collapsed && !isMobile ? 'Log out' : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-red-50 hover:text-red-600 dark:text-white/60 dark:hover:bg-red-500/10 dark:hover:text-red-400 ${
          collapsed && !isMobile ? 'justify-center' : ''
        }`}
      >
        <LogOut size={18} className="shrink-0" />
        {(!collapsed || isMobile) && 'Log out'}
      </NavLink>

      {!isMobile && (
        <button
          onClick={onToggleCollapsed}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-ink/10 py-2 text-xs font-semibold text-ink/50 transition hover:bg-ink/5 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/10"
        >
          {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          {!collapsed && 'Collapse'}
        </button>
      )}
    </>
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-ink/8 bg-white px-3 py-5 transition-all duration-200 dark:border-white/10 dark:bg-[#15161a] lg:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {content(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white px-3 py-5 dark:bg-[#15161a]">
            {content(true)}
          </aside>
        </div>
      )}
    </>
  );
}
