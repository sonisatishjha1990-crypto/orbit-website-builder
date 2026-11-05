import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import CreateWizard from './components/CreateWizard.jsx';
import SiteDetail from './components/SiteDetail.jsx';
import { Toast, Icon } from './ui.jsx';
import { api } from './api.js';

export default function App() {
  const [route, setRoute] = useState({ view: 'dashboard' });
  const [meta, setMeta] = useState({ industries: [], themes: [] });
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [offline, setOffline] = useState(false);

  const notify = useCallback((message, type = 'ok') => {
    setToast({ message, type, id: Date.now() });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 3400);
  }, []);

  const refreshStats = useCallback(() => {
    api.stats().then(setStats).catch(() => setOffline(true));
  }, []);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setOffline(true));
    api.health().then(() => setOffline(false)).catch(() => setOffline(true));
  }, []);

  useEffect(() => {
    refreshStats();
  }, [route, refreshStats]);

  const go = useCallback((view, slug, seed, tab) => {
    setRoute({ view, slug, seed, tab });
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        route={route}
        go={go}
        stats={stats}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-base/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button className="btn-ghost !px-2.5 !py-2" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent2">
              <Icon name="globe" className="h-4 w-4 text-white" />
            </span>
            Orbit
          </span>
          <button className="btn-primary !px-3 !py-2 text-xs" onClick={() => go('create')}>
            <Icon name="plus" className="h-4 w-4" /> New
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          {offline && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              <Icon name="alert" className="h-4 w-4 flex-none" />
              API not reachable. Start the backend with <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 font-mono">npm run dev</code> and refresh.
            </div>
          )}

          {route.view === 'dashboard' && (
            <Dashboard go={go} meta={meta} stats={stats} notify={notify} refreshStats={refreshStats} />
          )}
          {route.view === 'create' && (
            <CreateWizard meta={meta} seed={route.seed} go={go} notify={notify} refreshStats={refreshStats} />
          )}
          {route.view === 'site' && (
            <SiteDetail
              key={route.slug}
              slug={route.slug}
              initialTab={route.tab}
              meta={meta}
              go={go}
              notify={notify}
              refreshStats={refreshStats}
            />
          )}
        </main>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
