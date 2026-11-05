import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Badge, CopyButton, Icon, Spinner } from '../ui.jsx';

const STEPS = [
  { key: 'added', label: 'Domain added', detail: 'Orbit records the hostname against this site.' },
  { key: 'dns', label: 'DNS verified', detail: 'A, CNAME and TXT records resolve to our edge.' },
  { key: 'ssl', label: 'SSL issued', detail: 'Certificate provisioned for apex and www.' },
  { key: 'live', label: 'Serving traffic', detail: 'Requests to this host now return the site.' }
];

function stepIndex(status) {
  if (status === 'live') return 3;
  if (status === 'ssl_provisioning') return 2;
  if (status === 'verified' || status === 'verifying') return 1;
  return 0;
}

function recordTone(status) {
  if (status === 'verified') return 'live';
  if (status === 'checking') return 'building';
  return 'default';
}

export default function DnsPanel({ slug, notify, onDomainChange }) {
  const [domain, setDomain] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api.domain(slug);
      setDomain(d);
      onDomainChange?.(d);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [slug, onDomainChange]);

  useEffect(() => {
    load();
  }, [load]);

  // poll while the mapping is still moving through the pipeline
  useEffect(() => {
    if (!domain || domain.status === 'live') return;
    const t = setTimeout(load, 1100);
    return () => clearTimeout(t);
  }, [domain, load]);

  const connect = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api.mapDomain(slug, input.trim());
      setDomain(d);
      onDomainChange?.(d);
      notify(`${d.domain} queued for verification`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const recheck = async () => {
    setBusy(true);
    try {
      const d = await api.recheckDomain(slug);
      setDomain(d);
      notify('Re-running DNS checks');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Remove ${domain.domain} from this site?`)) return;
    setBusy(true);
    try {
      await api.removeDomain(slug);
      setDomain(null);
      onDomainChange?.(null);
      notify('Domain mapping removed');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center gap-3 p-6 text-sm text-dim">
        <Spinner /> Loading domain settings…
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="space-y-4">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
            <Icon name="globe" className="h-3.5 w-3.5" /> Custom domain
          </div>
          <h2 className="mt-2 text-lg font-semibold">Point your own domain here</h2>
          <p className="mt-1 max-w-xl text-sm text-dim">
            Enter a domain you own. Orbit creates the DNS records you need, then walks the mapping through
            verification and SSL — you can watch each step below.
          </p>

          <form onSubmit={connect} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              className="input flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value.toLowerCase())}
              placeholder="mybusiness.com"
              aria-label="Custom domain"
            />
            <button className="btn-primary" disabled={busy || !input.trim()}>
              {busy ? <Spinner /> : <Icon name="link" className="h-4 w-4" />} Connect domain
            </button>
          </form>
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-300">
              <Icon name="alert" className="h-3.5 w-3.5" /> {error}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { icon: 'globe', title: 'A record', text: 'Points the apex to the Orbit edge IP.' },
              { icon: 'link', title: 'CNAME', text: 'Sends www traffic to your subdomain.' },
              { icon: 'lock', title: 'TXT', text: 'Proves you control the domain.' }
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-line bg-panel2/50 p-3.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-indigo-300">
                  <Icon name={c.icon} className="h-3.5 w-3.5" />
                </span>
                <p className="mt-2 text-xs font-semibold">{c.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-dim">{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold text-dim">Prefer the free subdomain?</p>
          <p className="mt-1 text-sm">
            This site is already live at{' '}
            <a href={`/sites/${slug}`} target="_blank" rel="noreferrer" className="font-mono text-indigo-300 hover:underline">
              {slug}.orbit.local
            </a>
          </p>
        </div>
      </div>
    );
  }

  const idx = stepIndex(domain.status);
  const sslTone = domain.ssl?.status === 'active' ? 'live' : domain.ssl?.status === 'issuing' ? 'building' : 'default';

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{domain.domain}</h2>
              <Badge tone={domain.status === 'live' ? 'live' : 'building'}>
                {domain.status === 'live' ? 'Live' : domain.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-dim">
              {domain.domain} → {domain.target}
              <CopyButton value={domain.domain} label="Copy" />
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={recheck} disabled={busy} className="btn-ghost !py-2 text-xs">
              <Icon name="refresh" className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Recheck
            </button>
            <button onClick={remove} disabled={busy} className="btn-danger !py-2 text-xs">
              <Icon name="trash" className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>

        {/* pipeline */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {STEPS.map((s, i) => {
            const done = i < idx || (i === 3 && domain.status === 'live');
            const active = i === idx && domain.status !== 'live';
            return (
              <div
                key={s.key}
                className={`rounded-xl border p-3.5 transition ${
                  done ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : active ? 'border-accent/40 bg-accent/[0.07]' : 'border-line bg-panel2/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                      done ? 'bg-emerald-500/20 text-emerald-300' : active ? 'bg-accent/20 text-indigo-200' : 'bg-panel2 text-dim'
                    }`}
                  >
                    {done ? <Icon name="check" className="h-3 w-3" /> : active ? <Spinner className="h-3 w-3" /> : i + 1}
                  </span>
                  <p className={`text-xs font-semibold ${done || active ? 'text-ink' : 'text-dim'}`}>{s.label}</p>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-dim">{s.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* records */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          <h3 className="text-sm font-semibold">DNS records</h3>
          <span className="text-[11px] text-dim">Add these at your registrar · TTL in seconds</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-panel2/50 text-[10px] uppercase tracking-[0.12em] text-dim">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Value</th>
                <th className="px-3 py-2.5 font-semibold">TTL</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {domain.records.map((r) => (
                <tr key={`${r.type}-${r.name}`} className="hover:bg-panel2/30">
                  <td className="px-5 py-3">
                    <span className="rounded-md border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[10px] font-semibold">{r.type}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px]">{r.name}</td>
                  <td className="max-w-[260px] truncate px-3 py-3 font-mono text-[11px] text-dim">{r.value}</td>
                  <td className="px-3 py-3 text-dim">{r.ttl}</td>
                  <td className="px-3 py-3">
                    <Badge tone={recordTone(r.status)}>
                      {r.status === 'checking' && <Spinner className="h-3 w-3" />}
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CopyButton value={r.value} label="Copy" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-5 py-3 text-[11px] text-dim">
          Verification TXT record proves ownership before any certificate is issued. Propagation can take up to 24 hours at a
          registrar; here it is simulated in a few seconds.
        </div>
      </div>

      {/* ssl */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">SSL certificate</h3>
            <Badge tone={sslTone}>{domain.ssl?.status || 'pending'}</Badge>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-dim">Issuer</dt>
              <dd className="text-right font-medium">{domain.ssl?.issuer || "Let's Encrypt (simulated)"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-dim">Covers</dt>
              <dd className="text-right font-mono text-[11px]">{domain.domain}, www.{domain.domain}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-dim">Expires</dt>
              <dd className="text-right font-medium">
                {domain.ssl?.expiresAt ? new Date(domain.ssl.expiresAt).toLocaleDateString('en-IN') : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-dim">Last checked</dt>
              <dd className="text-right font-medium">
                {domain.checkedAt ? new Date(domain.checkedAt).toLocaleTimeString('en-IN') : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold">Traffic routing</h3>
          <p className="mt-2 text-xs leading-relaxed text-dim">
            The server inspects the incoming <span className="font-mono">Host</span> header. Once the mapping is live, any
            request for <span className="font-mono">{domain.domain}</span> is answered with this site&apos;s HTML — no
            redirect to a third-party host.
          </p>
          <div className="mt-3 space-y-2 rounded-xl border border-line bg-panel2/50 p-3 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-dim">
              <Icon name="arrowRight" className="h-3 w-3" /> GET https://{domain.domain}/
            </div>
            <div className="flex items-center gap-2 text-dim">
              <Icon name="arrowRight" className="h-3 w-3" /> host match → {domain.target}
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Icon name="check" className="h-3 w-3" /> 200 · site HTML
            </div>
          </div>
          {domain.status === 'live' && (
            <a href={`/sites/${slug}`} target="_blank" rel="noreferrer" className="btn-ghost mt-3 w-full !py-2 text-xs">
              <Icon name="external" className="h-3.5 w-3.5" /> Open {domain.domain}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
