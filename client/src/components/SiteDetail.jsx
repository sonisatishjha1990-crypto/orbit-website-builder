import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import DnsPanel from './DnsPanel.jsx';
import { Badge, CopyButton, Field, Icon, Spinner } from '../ui.jsx';

const TABS = [
  { id: 'preview', label: 'Preview', icon: 'eye' },
  { id: 'domain', label: 'Domain & DNS', icon: 'globe' },
  { id: 'source', label: 'Source', icon: 'code' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

export default function SiteDetail({ slug, initialTab, meta, go, notify, refreshStats }) {
  const [site, setSite] = useState(null);
  const [tab, setTab] = useState(initialTab || 'preview');
  const [device, setDevice] = useState('desktop');
  const [domain, setDomain] = useState(null);
  const [source, setSource] = useState('');
  const [nonce, setNonce] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const loadSite = useCallback(async () => {
    try {
      const s = await api.site(slug);
      setSite(s);
      setForm({
        businessName: s.businessName,
        industry: s.industry,
        theme: s.theme,
        description: s.description || '',
        city: s.city || '',
        phone: s.phone || ''
      });
    } catch (err) {
      notify(err.message, 'error');
      go('dashboard');
    }
  }, [slug, notify, go]);

  useEffect(() => {
    loadSite();
  }, [loadSite]);

  // refresh while building
  useEffect(() => {
    if (!site || site.status !== 'building') return;
    const t = setTimeout(async () => {
      const s = await api.site(slug).catch(() => null);
      if (s) {
        setSite(s);
        if (s.status === 'live') {
          setNonce(Date.now());
          refreshStats();
          notify('Site published');
        }
      }
    }, 900);
    return () => clearTimeout(t);
  }, [site, slug, notify, refreshStats]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (tab !== 'source' || source) return;
    api.site(slug, true).then((s) => setSource(s.html || '')).catch(() => setSource(''));
  }, [tab, slug, source]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSite(slug, form);
      setSite(updated);
      setSource('');
      notify('Rebuilding with the new details');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${site.businessName}? This removes the site and any mapped domain.`)) return;
    try {
      await api.deleteSite(slug);
      notify('Site deleted');
      refreshStats();
      go('dashboard');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const download = () => {
    const blob = new Blob([source], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!site || !form) {
    return (
      <div className="flex items-center gap-3 py-20 text-sm text-dim">
        <Spinner /> Loading site…
      </div>
    );
  }

  const tone = site.status === 'live' ? 'live' : site.status === 'building' ? 'building' : 'error';

  return (
    <div className="space-y-5">
      <button onClick={() => go('dashboard')} className="flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink">
        <Icon name="arrowLeft" className="h-3.5 w-3.5" /> All websites
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{site.businessName}</h1>
            <Badge tone={tone}>
              {site.status === 'building' && <Spinner className="h-3 w-3" />}
              {site.status === 'live' ? 'Live' : site.status === 'building' ? `Building ${site.progress || 0}%` : 'Error'}
            </Badge>
            {domain?.status === 'live' && <Badge tone="accent">{domain.domain}</Badge>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-dim">
            <span className="font-mono text-ink">{site.domain || `${site.slug}.orbit.local`}</span>
            <CopyButton
              value={site.domain ? `https://${site.domain}` : `${window.location.origin}/sites/${site.slug}`}
              label="Copy"
            />
            <span className="text-dim/60">preview: {site.slug}.orbit.local</span>
            <span className="text-dim/50">·</span>
            <span className="capitalize">{site.industry} · {site.theme}</span>
            <span className="text-dim/50">·</span>
            <span>{site.sizeKb ? `${site.sizeKb} KB` : '—'}</span>
            <span className="text-dim/50">·</span>
            <span>{site.views || 0} visits</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={site.domain && domain?.status === 'live' ? `https://${site.domain}` : `/sites/${site.slug}`}
            target="_blank"
            rel="noreferrer"
            className={`btn-ghost ${site.status !== 'live' ? 'pointer-events-none opacity-40' : ''}`}
          >
            <Icon name="external" className="h-4 w-4" /> {site.domain && domain?.status === 'live' ? `Open ${site.domain}` : 'Open preview'}
          </a>
          <button onClick={() => setTab('domain')} className="btn-primary">
            <Icon name="globe" className="h-4 w-4" /> {site.domain ? 'Domain & DNS' : 'Connect domain'}
          </button>
        </div>
      </div>

      {site.status === 'building' && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-[11px] text-dim">
            <span className="flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" /> {site.phaseLabel || 'Working'}…
            </span>
            <span className="font-mono">{site.progress || 0}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
              style={{ width: `${Math.max(4, site.progress || 4)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel/70 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              tab === t.id ? 'bg-panel2 text-ink shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]' : 'text-dim hover:text-ink'
            }`}
          >
            <Icon name={t.icon} className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'preview' && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-panel2/60 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="mx-auto flex min-w-0 flex-1 items-center gap-2 rounded-md bg-black/40 px-3 py-1 font-mono text-[11px] text-dim sm:max-w-sm">
              <Icon name="lock" className="h-3 w-3 flex-none text-emerald-400" />
              <span className="truncate">{domain?.status === 'live' ? domain.domain : `${site.slug}.orbit.local`}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDevice('desktop')}
                className={`grid h-7 w-8 place-items-center rounded-md ${device === 'desktop' ? 'bg-accent/20 text-indigo-200' : 'text-dim hover:text-ink'}`}
                aria-label="Desktop preview"
              >
                <Icon name="desktop" className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`grid h-7 w-8 place-items-center rounded-md ${device === 'mobile' ? 'bg-accent/20 text-indigo-200' : 'text-dim hover:text-ink'}`}
                aria-label="Mobile preview"
              >
                <Icon name="mobile" className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setNonce(Date.now())} className="grid h-7 w-8 place-items-center rounded-md text-dim hover:text-ink" aria-label="Reload preview">
                <Icon name="refresh" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex justify-center bg-[#0a0a11] p-3 sm:p-5">
            <iframe
              title={`${site.slug} preview`}
              src={`/sites/${site.slug}?v=${nonce}`}
              className={`h-[600px] rounded-xl border border-line bg-white transition-all duration-300 ${
                device === 'mobile' ? 'w-[390px] max-w-full' : 'w-full'
              }`}
            />
          </div>
        </div>
      )}

      {tab === 'domain' && <DnsPanel slug={slug} notify={notify} onDomainChange={setDomain} />}

      {tab === 'source' && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <span className="font-mono text-[11px] text-dim">{site.slug}/index.html · self-contained</span>
            <div className="flex gap-2">
              <CopyButton value={source} label="Copy HTML" />
              <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-dim hover:border-accent/50 hover:text-ink">
                <Icon name="external" className="h-3 w-3" /> Download
              </button>
            </div>
          </div>
          <pre className="max-h-[520px] overflow-auto bg-[#0a0a11] p-4 text-[11px] leading-relaxed text-slate-300">
            <code>{source ? source.slice(0, 40000) : 'Loading…'}</code>
          </pre>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <form onSubmit={save} className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold">Site details</h2>
            <Field label="Business name">
              <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Industry">
                <select className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                  {(meta.industries || []).map((i) => (
                    <option key={i.id} value={i.id}>{i.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Theme">
                <select className="input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
                  {(meta.themes || []).map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea
                className="input min-h-[96px] resize-y"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end border-t border-line pt-4">
              <button className="btn-primary" disabled={saving}>
                {saving ? <Spinner /> : <Icon name="refresh" className="h-4 w-4" />} Save & rebuild
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold">Hosting</h3>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-dim">Domain</dt>
                  <dd className="font-medium">{site.domain || 'not connected'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-dim">Preview address</dt>
                  <dd className="font-mono text-[11px]">{site.slug}.orbit.local</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-dim">Created</dt>
                  <dd className="font-medium">{new Date(site.createdAt).toLocaleDateString('en-IN')}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-dim">Last publish</dt>
                  <dd className="font-medium">{site.publishedAt ? new Date(site.publishedAt).toLocaleString('en-IN') : '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="card border-rose-500/20 p-5">
              <h3 className="text-sm font-semibold text-rose-200">Danger zone</h3>
              <p className="mt-1 text-xs text-dim">
                Deleting removes the generated files, the subdomain and any domain mapping. This cannot be undone.
              </p>
              <button onClick={remove} className="btn-danger mt-3 w-full !py-2 text-xs">
                <Icon name="trash" className="h-3.5 w-3.5" /> Delete this site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
