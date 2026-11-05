import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Badge, CopyButton, Field, Icon, Spinner } from '../ui.jsx';

const PHASES = [
  { key: 'analyze', label: 'Reading business details' },
  { key: 'copy', label: 'Writing copy & structure' },
  { key: 'layout', label: 'Composing layout' },
  { key: 'style', label: 'Applying theme' },
  { key: 'publish', label: 'Publishing to edge' }
];

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

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

function Stepper({ step, mode }) {
  const steps = ['Details', mode === 'subdomain' ? 'Address' : 'Domain', 'Publish'];
  const current = step === 'details' ? 0 : step === 'address' ? 1 : 2;
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold transition ${
              i < current
                ? 'bg-emerald-500/15 text-emerald-300'
                : i === current
                ? 'bg-gradient-to-br from-accent to-accent2 text-white'
                : 'bg-panel2 text-dim'
            }`}
          >
            {i < current ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={`text-xs font-medium ${i === current ? 'text-ink' : 'text-dim'}`}>{label}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line sm:w-10" />}
        </div>
      ))}
    </div>
  );
}

export default function CreateWizard({ meta, seed, go, notify, refreshStats }) {
  const [step, setStep] = useState('details');
  const [mode, setMode] = useState('domain'); // 'domain' → bring your own domain, 'subdomain' → free Orbit address
  const [form, setForm] = useState({
    businessName: '',
    industry: 'bakery',
    theme: 'aurora',
    description: '',
    city: 'Bengaluru, India',
    phone: '',
    slug: '',
    domain: ''
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [check, setCheck] = useState(null);
  const [checking, setChecking] = useState(false);
  const [site, setSite] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [device, setDevice] = useState('desktop');
  const timer = useRef(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (seed?.domain) {
      setForm((f) => ({ ...f, domain: seed.domain }));
      setMode('domain');
    } else if (seed?.slug) {
      setForm((f) => ({ ...f, slug: seed.slug }));
      setSlugTouched(true);
      setMode('subdomain');
    }
  }, [seed]);

  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: slugify(f.businessName) }));
  }, [form.businessName, slugTouched]);

  // subdomain availability only matters for the free-address fallback
  useEffect(() => {
    if (step !== 'address' || mode !== 'subdomain') return;
    setCheck(null);
    if (!form.slug || form.slug.length < 2) return;
    setChecking(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await api.checkSlug(form.slug);
        setCheck(res);
      } catch (err) {
        setCheck({ available: false, reason: err.message });
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => window.clearTimeout(timer.current);
  }, [form.slug, step, mode]);

  useEffect(() => {
    if (step !== 'build' || !site) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.status(site.slug);
        if (cancelled) return;
        setStatus(res);
        if (res.status === 'live') {
          setStep('done');
          refreshStats();
        } else if (res.status === 'error') {
          setError('Build failed. Try again with different details.');
          setStep('address');
        } else {
          setTimeout(poll, 500);
        }
      } catch (err) {
        if (!cancelled) setTimeout(poll, 900);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [step, site, refreshStats]);

  const canContinue = form.businessName.trim().length >= 2;
  const domainOk = validDomain(form.domain);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        businessName: form.businessName,
        industry: form.industry,
        theme: form.theme,
        description: form.description,
        city: form.city,
        phone: form.phone
      };
      if (mode === 'domain') payload.domain = cleanDomain(form.domain);
      else payload.slug = form.slug;

      const created = await api.createSite(payload);
      setSite(created);
      setStatus({ status: 'building', progress: 4, phaseLabel: 'Queued' });
      setStep('build');
      notify(mode === 'domain' ? `Building for ${created.domain}` : 'Generation started');
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const industryOptions = meta.industries || [];
  const themeOptions = meta.themes || [];
  const previewUrl = site ? `/sites/${site.slug}` : '';

  const selectedTheme = useMemo(
    () => themeOptions.find((t) => t.id === form.theme) || { accent: '#6366f1', accent2: '#22d3ee' },
    [themeOptions, form.theme]
  );

  /* ------------------------------ build screen ------------------------------ */
  if (step === 'build') {
    const progress = status?.progress ?? 4;
    const activePhase = status?.phase || 'analyze';
    return (
      <div className="mx-auto max-w-2xl py-6">
        <Stepper step="build" mode={mode} />
        <div className="card mt-6 overflow-hidden">
          <div className="relative border-b border-line bg-gradient-to-br from-accent/15 via-panel2 to-cyan-400/10 px-6 py-10 text-center">
            <div className="relative mx-auto grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/25" />
              <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent2 shadow-glow">
                <Icon name="sparkles" className="h-7 w-7 text-white" />
              </span>
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight">Generating {form.businessName}</h2>
            <p className="mt-1 text-sm text-dim">
              {mode === 'domain' ? `Preparing ${cleanDomain(form.domain)}` : status?.phaseLabel || 'Queued'}
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between text-[11px] font-medium text-dim">
              <span>Build pipeline</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>

            <ul className="mt-5 space-y-2.5">
              {PHASES.map((p) => {
                const idx = PHASES.findIndex((x) => x.key === activePhase);
                const mine = PHASES.findIndex((x) => x.key === p.key);
                const done = mine < idx || progress >= 100;
                const active = mine === idx && progress < 100;
                return (
                  <li key={p.key} className="flex items-center gap-3 text-sm">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                        done ? 'bg-emerald-500/15 text-emerald-300' : active ? 'bg-accent/15 text-indigo-300' : 'bg-panel2 text-dim'
                      }`}
                    >
                      {done ? <Icon name="check" className="h-3 w-3" /> : active ? <Spinner className="h-3 w-3" /> : null}
                    </span>
                    <span className={done || active ? 'text-ink' : 'text-dim'}>{p.label}</span>
                    {done && <span className="ml-auto text-[10px] text-dim">done</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ result screen ----------------------------- */
  if (step === 'done' && site) {
    const primary = site.domain || site.host || `${site.slug}.orbit.local`;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{site.businessName}</h1>
              <Badge tone="live">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-dim">
              <span className="font-mono text-ink">{primary}</span>
              <CopyButton value={site.domain ? `https://${site.domain}` : `${window.location.origin}/sites/${site.slug}`} label="Copy URL" />
              {site.domain && <span className="text-dim/60">preview: {site.slug}.orbit.local</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-line bg-panel2 p-0.5">
              {['desktop', 'mobile'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={`grid h-8 w-9 place-items-center rounded-md transition ${
                    device === d ? 'bg-accent/20 text-indigo-200' : 'text-dim hover:text-ink'
                  }`}
                  aria-label={`${d} preview`}
                >
                  <Icon name={d} className="h-4 w-4" />
                </button>
              ))}
            </div>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-ghost">
              <Icon name="external" className="h-4 w-4" /> Open preview
            </a>
            <button onClick={() => go('site', site.slug, undefined, 'domain')} className="btn-primary">
              <Icon name="globe" className="h-4 w-4" /> {site.domain ? 'DNS & SSL status' : 'Connect a domain'}
            </button>
          </div>
        </div>

        {site.domain && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-xs text-indigo-200">
            <Icon name="globe" className="h-4 w-4 flex-none" />
            <span className="flex-1">
              <strong className="font-semibold">{site.domain}</strong> is connected. Add the three DNS records at your
              registrar — verification and SSL are running now, and the site will answer on that domain once they resolve.
            </span>
            <button onClick={() => go('site', site.slug, undefined, 'domain')} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">
              View records
            </button>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-panel2/60 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="mx-auto flex max-w-sm flex-1 items-center gap-2 rounded-md bg-black/40 px-3 py-1 font-mono text-[11px] text-dim">
              <Icon name="lock" className="h-3 w-3 text-emerald-400" />
              {primary}
            </div>
          </div>
          <div className="flex justify-center bg-[#0a0a11] p-3 sm:p-5">
            <iframe
              title="Generated website preview"
              src={`${previewUrl}?v=${site.updatedAt || ''}`}
              className={`h-[560px] rounded-xl border border-line bg-white transition-all duration-300 ${
                device === 'mobile' ? 'w-[390px] max-w-full' : 'w-full'
              }`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <button onClick={() => { setStep('details'); setSite(null); setStatus(null); }} className="btn-ghost">
            <Icon name="plus" className="h-4 w-4" /> Build another site
          </button>
          <button onClick={() => go('dashboard')} className="text-xs font-medium text-dim hover:text-ink">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------ form screens ------------------------------ */
  const previewCard = (
    <div className="card sticky top-6 overflow-hidden">
      <div className="border-b border-line px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
        Live brief
      </div>
      <div className="p-4">
        <div
          className="relative h-28 overflow-hidden rounded-xl"
          style={{ background: `linear-gradient(135deg, ${selectedTheme.accent}, ${selectedTheme.accent2})` }}
        >
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_70%_20%,#fff,transparent_55%)]" />
          <div className="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-slate-900">
            {form.businessName || 'Your business name'}
          </div>
        </div>
        <dl className="mt-4 space-y-2.5 text-xs">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-dim">Industry</dt>
            <dd className="text-right font-medium">{industryOptions.find((i) => i.id === form.industry)?.label || '—'}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-dim">Theme</dt>
            <dd className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-full" style={{ background: selectedTheme.accent }} />
              {selectedTheme.label}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-dim">Address</dt>
            <dd className="max-w-[62%] break-all text-right font-mono text-[11px]">
              {mode === 'domain' ? cleanDomain(form.domain) || 'yourdomain.com' : `${form.slug || '—'}.orbit.local`}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-dim">Sections</dt>
            <dd className="text-right font-medium">Hero · Services · About · Reviews · Contact</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-lg border border-line bg-panel2/60 p-3 text-[11px] leading-relaxed text-dim">
          Generated fully offline from templates — no OpenAI or third-party API is contacted.
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New website</h1>
          <p className="mt-1 text-sm text-dim">Describe the business, connect your domain, publish.</p>
        </div>
        <Stepper step={step} mode={mode} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="card p-5 sm:p-6">
          {step === 'details' ? (
            <div className="rise space-y-5">
              <Field label="Business name">
                <input
                  className="input"
                  value={form.businessName}
                  onChange={(e) => set('businessName', e.target.value)}
                  placeholder="e.g. Kavi's Bakehouse"
                  autoFocus
                />
              </Field>

              <div>
                <span className="label">Industry</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {industryOptions.map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => set('industry', ind.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                        form.industry === ind.id
                          ? 'border-accent/60 bg-accent/10 text-ink'
                          : 'border-line bg-panel2/50 text-dim hover:border-accent/30 hover:text-ink'
                      }`}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="label">Theme</span>
                <div className="flex flex-wrap gap-2">
                  {themeOptions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => set('theme', t.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                        form.theme === t.id ? 'border-accent/60 bg-accent/10' : 'border-line bg-panel2/50 text-dim hover:text-ink'
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})` }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="What do you do?"
                hint="Two or three sentences. This becomes the About section of the site — leave it blank and the industry default is used."
              >
                <textarea
                  className="input min-h-[104px] resize-y"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="A neighbourhood bakery doing naturally leavened bread and custom cakes, open Tuesday to Sunday."
                  maxLength={1200}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City (optional)">
                  <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Bengaluru, India" />
                </Field>
                <Field label="Phone (optional)">
                  <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 80 4000 1234" />
                </Field>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-4">
                <button onClick={() => go('dashboard')} className="text-xs font-medium text-dim hover:text-ink">
                  Cancel
                </button>
                <button onClick={() => setStep('address')} disabled={!canContinue} className="btn-primary">
                  Continue <Icon name="arrowRight" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rise space-y-5">
              <div className="flex gap-2 rounded-xl border border-line bg-panel2/40 p-1">
                <button
                  onClick={() => setMode('domain')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    mode === 'domain' ? 'bg-panel2 text-ink shadow-[inset_0_0_0_1px_rgba(99,102,241,0.4)]' : 'text-dim hover:text-ink'
                  }`}
                >
                  <Icon name="globe" className="h-3.5 w-3.5" /> My own domain
                </button>
                <button
                  onClick={() => setMode('subdomain')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    mode === 'subdomain' ? 'bg-panel2 text-ink shadow-[inset_0_0_0_1px_rgba(99,102,241,0.4)]' : 'text-dim hover:text-ink'
                  }`}
                >
                  <Icon name="link" className="h-3.5 w-3.5" /> Free Orbit address
                </button>
              </div>

              {mode === 'domain' ? (
                <>
                  <div>
                    <span className="label">Your domain</span>
                    <div className="flex items-center rounded-xl border border-line bg-panel2 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/25">
                      <span className="pl-3.5 text-dim">
                        <Icon name="globe" className="h-4 w-4" />
                      </span>
                      <input
                        className="w-full bg-transparent px-2.5 py-3 text-sm outline-none placeholder:text-dim/60"
                        value={form.domain}
                        onChange={(e) => set('domain', cleanDomain(e.target.value))}
                        placeholder="mybusiness.com"
                        autoFocus
                      />
                    </div>
                    <div className="mt-2 flex min-h-[20px] items-center gap-2 text-xs">
                      {!form.domain && <span className="text-dim">The domain you already own — apex or subdomain, both work.</span>}
                      {form.domain && domainOk && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
                          <Icon name="check" className="h-3.5 w-3.5" /> {cleanDomain(form.domain)} will be the live address
                        </span>
                      )}
                      {form.domain && !domainOk && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-rose-300">
                          <Icon name="alert" className="h-3.5 w-3.5" /> That does not look like a domain — try mybusiness.com
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-panel2/50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">What we set up for you</p>
                    <ul className="mt-2.5 grid gap-2 text-xs text-dim sm:grid-cols-2">
                      {[
                        'A record for the apex',
                        'CNAME for www',
                        'TXT record for ownership',
                        'SSL certificate for both',
                        'DNS + SSL status tracker',
                        'Auto re-check any time'
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <Icon name="check" className="h-3.5 w-3.5 text-emerald-400" /> {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[11px] leading-relaxed text-dim/80">
                      We generate the exact records to paste at your registrar (GoDaddy, Namecheap, Cloudflare, BigRock…) and
                      watch them until they resolve. The site also gets an internal preview address you can share meanwhile.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="label">Your Orbit address</span>
                    <div className="flex items-center rounded-xl border border-line bg-panel2 focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/25">
                      <input
                        className="w-full bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-dim/60"
                        value={form.slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        }}
                        placeholder="my-business"
                        autoFocus
                      />
                      <span className="whitespace-nowrap border-l border-line px-3 py-3 font-mono text-xs text-dim">.orbit.local</span>
                    </div>
                    <div className="mt-2 flex min-h-[20px] items-center gap-2 text-xs">
                      {checking && (
                        <>
                          <Spinner className="h-3.5 w-3.5 text-dim" /> <span className="text-dim">Checking…</span>
                        </>
                      )}
                      {!checking && check && (
                        <span className={`inline-flex items-center gap-1.5 font-medium ${check.available ? 'text-emerald-300' : 'text-rose-300'}`}>
                          <Icon name={check.available ? 'check' : 'close'} className="h-3.5 w-3.5" />
                          {check.available ? 'Available' : check.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-dim/80">
                    No domain yet? Start here and connect a domain later from the site&apos;s Domain tab — the records and
                    certificate are handled the same way.
                  </p>
                </>
              )}

              <div className="flex items-center justify-between border-t border-line pt-4">
                <button onClick={() => setStep('details')} className="btn-ghost !py-2 text-xs">
                  <Icon name="arrowLeft" className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  onClick={submit}
                  disabled={submitting || (mode === 'domain' ? !domainOk : !check?.available || !form.slug)}
                  className="btn-primary"
                >
                  {submitting ? <Spinner /> : <Icon name="sparkles" className="h-4 w-4" />}
                  {mode === 'domain' ? 'Generate & connect domain' : 'Generate website'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block">{previewCard}</div>
      </div>
    </div>
  );
}
