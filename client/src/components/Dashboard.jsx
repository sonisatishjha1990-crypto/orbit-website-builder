import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Badge, CopyButton, Icon, Spinner } from '../ui.jsx';

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

const cleanDomain = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');

function validDomain(value) {
  const d = cleanDomain(value);
  const parts = d.split('.');
  return DOMAIN_RE.test(d) && parts.length >= 2 && parts[parts.length - 1].length >= 2;
}

function Stat({ icon, label, value, hint }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-indigo-300">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        {hint && <span className="text-[10px] font-medium text-dim/70">{hint}</span>}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-dim">{label}</p>
    </div>
  );
}

function SiteCard({ site, go, notify }) {
  const preview = `/sites/${site.slug}`;
  const host = site.domain || `${site.slug}.orbit.local`;
  const tone = site.status === 'live' ? 'live' : site.status === 'building' ? 'building' : 'error';

  return (
    <div className="card card-hover group overflow-hidden">
      <div className="relative h-28 overflow-hidden border-b border-line bg-gradient-to-br from-indigo-500/20 via-panel2 to-cyan-400/10">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#ffffff0d_1px,transparent_1px),linear-gradient(90deg,#ffffff0d_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
          <span className="truncate rounded-lg bg-black/40 px-2 py-1 font-mono text-[11px] text-white/90 backdrop-blur">
            {host}
          </span>
          <Badge tone={tone}>
            <span className={`h-1.5 w-1.5 rounded-full ${site.status === 'live' ? 'bg-emerald-400' : site.status === 'building' ? 'bg-amber-400' : 'bg-rose-400'}`} />
            {site.status === 'live' ? 'Live' : site.status === 'building' ? `${site.progress || 0}%` : 'Error'}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="truncate text-sm font-semibold">{site.businessName}</h3>
        <p className="mt-0.5 text-[11px] text-dim">
          <span className="capitalize">{site.industry}</span> · <span className="capitalize">{site.theme}</span> theme
          {site.domain ? '' : ' · no domain yet'}
        </p>

        <div className="mt-3.5 flex items-center gap-2">
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            onClick={() => notify(`Opening preview for ${site.businessName}`)}
            className={`btn-ghost flex-1 !px-2.5 !py-2 text-xs ${site.status !== 'live' ? 'pointer-events-none opacity-40' : ''}`}
          >
            <Icon name="external" className="h-3.5 w-3.5" /> Preview
          </a>
          <button onClick={() => go('site', site.slug)} className="btn-primary flex-1 !px-2.5 !py-2 text-xs">
            <Icon name="settings" className="h-3.5 w-3.5" /> Manage
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ go, stats, notify, refreshStats }) {
  const [sites, setSites] = useState(null);
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.sites().then(setSites).catch(() => setSites([]));
    api.domains().then(setDomains).catch(() => setDomains([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sites || !sites.some((s) => s.status === 'building')) return;
    const t = setTimeout(() => {
      load();
      refreshStats();
    }, 1200);
    return () => clearTimeout(t);
  }, [sites, load, refreshStats]);

  const start = () => {
    const d = cleanDomain(domain);
    if (!d) return;
    if (!validDomain(d)) {
      setError('Enter a valid domain, for example mybusiness.com');
      return;
    }
    setError('');
    go('create', null, { domain: d });
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Dashboard</h1>
          <p className="mt-1 text-sm text-dim">Describe a business, connect your domain, publish in under a minute.</p>
        </div>
        <button onClick={() => go('create')} className="btn-primary">
          <Icon name="sparkles" className="h-4 w-4" /> Generate a website
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon="layers" label="Websites" value={stats?.sites ?? '—'} hint="total" />
        <Stat icon="zap" label="Live" value={stats?.live ?? '—'} hint="published" />
        <Stat icon="globe" label="Domains" value={stats?.withDomain ?? '—'} hint={`${stats?.domainsLive ?? 0} resolving`} />
        <Stat icon="eye" label="Visits" value={stats?.views ?? '—'} hint="all sites" />
      </div>

      {/* start with your domain */}
      <section className="card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">
            <Icon name="globe" className="h-3.5 w-3.5" /> Publish on your own domain
          </div>
          <h2 className="mt-2 text-lg font-semibold">Which domain should this site live on?</h2>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-line bg-panel2 px-3.5 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/25">
              <Icon name="globe" className="h-4 w-4 flex-none text-dim" />
              <input
                value={domain}
                onChange={(e) => {
                  setDomain(cleanDomain(e.target.value));
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && start()}
                placeholder="mybusiness.com"
                className="w-full bg-transparent px-2.5 py-2.5 text-sm outline-none placeholder:text-dim/60"
                aria-label="Your domain"
              />
            </div>
            <button onClick={start} disabled={!domain} className="btn-primary sm:w-auto">
              <Icon name="arrowRight" className="h-4 w-4" /> Start with this domain
            </button>
          </div>

          <p className={`mt-3 text-[11px] ${error ? 'text-rose-300' : 'text-dim/70'}`}>
            {error || 'We create the A, CNAME and TXT records, run the SSL checks and track the status until it resolves. No domain yet? Use a free Orbit address from the builder.'}
          </p>
        </div>
      </section>

      {/* sites */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-dim">Your websites</h2>
          <button onClick={load} className="text-[11px] font-medium text-dim transition hover:text-ink">
            Refresh
          </button>
        </div>

        {sites === null ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skel h-28 rounded-none" />
                <div className="space-y-2 p-4">
                  <div className="skel h-3.5 w-2/3" />
                  <div className="skel h-2.5 w-1/3" />
                  <div className="skel mt-3 h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-indigo-300">
              <Icon name="rocket" className="h-6 w-6" />
            </span>
            <h3 className="text-base font-semibold">No websites yet</h3>
            <p className="max-w-sm text-sm text-dim">
              Add a business name, pick an industry and theme, connect your domain — Orbit writes a complete responsive site.
            </p>
            <button onClick={() => go('create')} className="btn-primary mt-1">
              <Icon name="plus" className="h-4 w-4" /> Create your first site
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.slug} site={site} go={go} notify={notify} />
            ))}
          </div>
        )}
      </section>

      {/* domains table */}
      {domains.length > 0 && (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-sm font-semibold">Connected domains</h2>
            <span className="text-[11px] text-dim">{domains.length} total</span>
          </div>
          <div className="divide-y divide-line">
            {domains.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <Icon name="globe" className="h-4 w-4 text-dim" />
                <span className="font-medium">{d.domain}</span>
                <span className="font-mono text-[11px] text-dim">→ {d.target}</span>
                <div className="ml-auto flex items-center gap-2">
                  <CopyButton value={d.domain} label="Copy" />
                  <Badge tone={d.status === 'live' ? 'live' : d.status === 'pending' ? 'default' : 'building'}>
                    {d.status.replace('_', ' ')}
                  </Badge>
                  <button onClick={() => go('site', d.siteSlug, undefined, 'domain')} className="text-[11px] font-medium text-dim hover:text-ink">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="pb-2 text-center text-[11px] text-dim/60">
        Generation runs locally on your server — no third-party AI calls.
      </p>
    </div>
  );
}
