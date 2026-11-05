import { Icon } from '../ui.jsx';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'create', label: 'New website', icon: 'sparkles' }
];

export default function Sidebar({ route, go, stats, open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-line bg-panel/95 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <button className="flex items-center gap-2.5" onClick={() => go('dashboard')}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-glow">
              <Icon name="globe" className="h-[18px] w-[18px] text-white" strokeWidth={2} />
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold tracking-tight">Orbit</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-dim">Website builder</span>
            </span>
          </button>
          <button className="btn-ghost !p-2 lg:hidden" onClick={onClose} aria-label="Close menu">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`nav-item ${route.view === item.id ? 'nav-item-active' : ''}`}
            >
              <Icon name={item.icon} className="h-[17px] w-[17px]" />
              {item.label}
            </button>
          ))}
          <button
            onClick={() => go('dashboard')}
            className={`nav-item ${route.view === 'site' ? 'nav-item-active' : ''}`}
          >
            <Icon name="layers" className="h-[17px] w-[17px]" />
            My websites
            {stats?.sites ? (
              <span className="ml-auto rounded-md bg-panel2 px-1.5 py-0.5 text-[10px] font-semibold text-dim">{stats.sites}</span>
            ) : null}
          </button>
        </nav>

        <div className="mt-6 px-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-dim/70">Usage</p>
          <div className="rounded-xl border border-line bg-panel2/60 p-3.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-dim">Sites live</span>
              <span className="font-semibold">{stats?.live ?? 0}</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
                style={{ width: `${Math.min(100, ((stats?.live ?? 0) / 10) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-dim/80">
              {stats?.domains ?? 0} custom domain{stats?.domains === 1 ? '' : 's'} mapped
            </p>
          </div>
        </div>

        <div className="mt-auto px-3 pb-5">
          <button onClick={() => go('create')} className="btn-primary w-full">
            <Icon name="plus" className="h-4 w-4" /> Build a website
          </button>
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-dim/60">
            Local build · no external AI calls · sites served from this server
          </p>
        </div>
      </aside>
    </>
  );
}
