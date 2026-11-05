'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const store = require('./store');
const { buildSite, INDUSTRIES, THEMES, slugify } = require('./generator');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

const RESERVED = new Set([
  'www', 'api', 'app', 'admin', 'mail', 'dashboard', 'orbit', 'static',
  'cdn', 'assets', 'dev', 'staging', 'sites', 'docs', 'status', 'blog', 'support'
]);

const BUILD_PHASES = [
  { key: 'analyze', label: 'Analyzing business details' },
  { key: 'copy', label: 'Drafting copy and section structure' },
  { key: 'layout', label: 'Composing responsive layout' },
  { key: 'style', label: 'Applying theme, type and spacing' },
  { key: 'publish', label: 'Publishing to edge network' }
];

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

const uid = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
const now = () => new Date().toISOString();

function publicSite(site, { withHtml = false } = {}) {
  if (!site) return null;
  const { html, ...rest } = site;
  const host = siteHost(site);
  const shaped = {
    ...rest,
    host,
    url: site.domain ? `https://${site.domain}` : `/sites/${site.slug}`,
    previewUrl: `/sites/${site.slug}`
  };
  return withHtml ? { ...shaped, html } : shaped;
}

function findSite(slug) {
  return store.read().sites.find((s) => s.slug === slug);
}

function normalizeDomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
}

/** The address the site is presented under: its own domain first, subdomain as fallback. */
function siteHost(site) {
  return site.domain || `${site.slug}.orbit.local`;
}

function regenerateHtml(site) {
  site.html = buildSite({
    businessName: site.businessName,
    industry: site.industry,
    theme: site.theme,
    description: site.description,
    city: site.city,
    phone: site.phone,
    slug: site.slug,
    domain: site.domain || undefined
  });
  site.sizeKb = Math.round(Buffer.byteLength(site.html) / 1024);
  return site.html;
}

function createDomainMapping(site, domain) {
  const db = store.read();
  db.domains = db.domains.filter((d) => d.siteSlug !== site.slug);
  const record = {
    id: uid('dom'),
    siteSlug: site.slug,
    domain,
    target: `${site.slug}.orbit.local`,
    status: 'pending',
    records: dnsRecords(site, domain),
    ssl: { status: 'pending', issuer: "Let's Encrypt (simulated)", expiresAt: null },
    createdAt: now(),
    checkedAt: null,
    verifiedAt: null,
    liveAt: null
  };
  db.domains.push(record);
  const siteInDb = db.sites.find((s) => s.slug === site.slug);
  if (siteInDb) {
    siteInDb.domain = domain;
    if (siteInDb.html) regenerateHtml(siteInDb);
    siteInDb.updatedAt = now();
  }
  store.write(db);
  runDomainChecks(record.id);
  return record;
}

/* ------------------------------------------------------------------ *
 * Generation pipeline (simulated multi-stage build)
 * ------------------------------------------------------------------ */
function runBuild(slug) {
  let index = 0;
  const tick = () => {
    const db = store.read();
    const site = db.sites.find((s) => s.slug === slug);
    if (!site) return; // deleted mid-build

    if (index < BUILD_PHASES.length) {
      const phase = BUILD_PHASES[index];
      site.status = 'building';
      site.phase = phase.key;
      site.phaseLabel = phase.label;
      site.progress = Math.round(((index + 0.65) / BUILD_PHASES.length) * 100);
      site.updatedAt = now();
      store.write(db);
      index += 1;
      setTimeout(tick, 620 + Math.round(Math.random() * 320));
      return;
    }

    try {
      regenerateHtml(site);
      site.status = 'live';
      site.phase = 'done';
      site.phaseLabel = 'Published';
      site.progress = 100;
      site.publishedAt = now();
      site.updatedAt = now();
    } catch (err) {
      site.status = 'error';
      site.phase = 'error';
      site.phaseLabel = 'Build failed';
      site.error = err.message;
    }
    store.write(db);
  };
  setTimeout(tick, 450);
}

/* ------------------------------------------------------------------ *
 * Domain mapping state machine (DNS + SSL simulation)
 * ------------------------------------------------------------------ */
function dnsRecords(site, domain) {
  return [
    { type: 'A', name: '@', value: '76.76.21.21', ttl: '3600', status: 'pending', purpose: 'Root domain' },
    { type: 'CNAME', name: 'www', value: `${site.slug}.orbit.local`, ttl: '3600', status: 'pending', purpose: 'www redirect' },
    { type: 'TXT', name: '_orbit-verify', value: `orbit-verify=${crypto.createHash('sha256').update(domain + site.slug).digest('hex').slice(0, 32)}`, ttl: '300', status: 'pending', purpose: 'Ownership proof' }
  ];
}

function runDomainChecks(domainId) {
  const steps = [
    { after: 900, apply: (d) => { d.status = 'verifying'; d.records.forEach((r) => { r.status = 'checking'; }); } },
    { after: 2100, apply: (d) => { d.status = 'verified'; d.records.forEach((r) => { r.status = 'verified'; }); d.verifiedAt = now(); } },
    { after: 3400, apply: (d) => { d.status = 'ssl_provisioning'; d.ssl.status = 'issuing'; } },
    { after: 5000, apply: (d) => {
      d.status = 'live';
      d.ssl.status = 'active';
      d.ssl.issuedAt = now();
      d.ssl.expiresAt = new Date(Date.now() + 90 * 864e5).toISOString();
      d.liveAt = now();
    } }
  ];
  steps.forEach(({ after, apply }) => {
    setTimeout(() => {
      const db = store.read();
      const d = db.domains.find((x) => x.id === domainId);
      if (!d) return;
      apply(d);
      d.checkedAt = now();
      store.write(db);
    }, after);
  });
}

/* ------------------------------------------------------------------ *
 * Host routing: a mapped custom domain (or subdomain) serves its site
 * ------------------------------------------------------------------ */
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  if (/\.(js|css|map|png|jpg|svg|ico|webp|woff2?)$/.test(req.path)) return next();

  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  const base = host.split('.')[0];
  const db = store.read();

  const mapped = db.domains.find((d) => d.domain === host && d.status === 'live');
  if (mapped) {
    const site = db.sites.find((s) => s.slug === mapped.siteSlug && s.html);
    if (site) {
      site.views = (site.views || 0) + 1;
      store.write(db);
      return res.type('html').send(site.html);
    }
  }
  if (host.endsWith('.orbit.local')) {
    const site = db.sites.find((s) => s.slug === base && s.html);
    if (site) {
      site.views = (site.views || 0) + 1;
      store.write(db);
      return res.type('html').send(site.html);
    }
  }
  next();
});

/* ------------------------------------------------------------------ *
 * API
 * ------------------------------------------------------------------ */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'orbit-builder', uptime: process.uptime(), time: now() });
});

app.get('/api/meta', (req, res) => {
  res.json({
    industries: Object.entries(INDUSTRIES).map(([id, v]) => ({ id, label: v.label, headline: v.headline })),
    themes: Object.entries(THEMES).map(([id, v]) => ({ id, label: v.label, accent: v.accent, accent2: v.accent2 })),
    reserved: [...RESERVED]
  });
});

app.get('/api/stats', (req, res) => {
  const db = store.read();
  res.json({
    sites: db.sites.length,
    live: db.sites.filter((s) => s.status === 'live').length,
    domains: db.domains.length,
    domainsLive: db.domains.filter((d) => d.status === 'live').length,
    withDomain: db.sites.filter((s) => !!s.domain).length,
    views: db.sites.reduce((n, s) => n + (s.views || 0), 0)
  });
});

app.get('/api/subdomains/check', (req, res) => {
  const raw = String(req.query.slug || '').trim().toLowerCase();
  const slug = slugify(raw);
  if (!slug) return res.json({ available: false, slug, reason: 'Enter a subdomain to check.' });
  if (RESERVED.has(slug)) return res.json({ available: false, slug, reason: 'That subdomain is reserved by the platform.' });
  if (!SLUG_RE.test(slug)) return res.json({ available: false, slug, reason: 'Use 2–40 lowercase letters, numbers or hyphens.' });
  const taken = store.read().sites.some((s) => s.slug === slug);
  res.json({
    available: !taken,
    slug,
    reason: taken ? 'Already taken by another site.' : 'Available — it is yours.',
    url: `http://localhost:4000/sites/${slug}`
  });
});

app.get('/api/sites', (req, res) => {
  const sites = store.read().sites
    .slice()
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .map((s) => publicSite(s));
  res.json({ sites });
});

app.get('/api/sites/:slug', (req, res) => {
  const site = findSite(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json({ site: publicSite(site, { withHtml: req.query.html === '1' }) });
});

app.get('/api/sites/:slug/status', (req, res) => {
  const site = findSite(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json({
    slug: site.slug,
    status: site.status,
    phase: site.phase,
    phaseLabel: site.phaseLabel,
    progress: site.progress || 0,
    host: siteHost(site),
    url: site.status === 'live' ? (site.domain ? `https://${site.domain}` : `/sites/${site.slug}`) : null
  });
});

app.post('/api/sites', (req, res) => {
  const body = req.body || {};
  const businessName = String(body.businessName || '').trim();
  const industry = String(body.industry || 'other');
  const theme = String(body.theme || 'aurora');
  const description = String(body.description || '').trim().slice(0, 1200);
  const city = String(body.city || 'Bengaluru, India').trim().slice(0, 80);
  const phone = String(body.phone || '+91 80 4000 1234').trim().slice(0, 24);
  const domain = normalizeDomain(body.domain);

  if (businessName.length < 2) return res.status(400).json({ error: 'Business name needs at least 2 characters.' });
  if (!INDUSTRIES[industry]) return res.status(400).json({ error: 'Unknown industry.' });
  if (!THEMES[theme]) return res.status(400).json({ error: 'Unknown theme.' });

  if (domain) {
    if (!DOMAIN_RE.test(domain)) {
      return res.status(400).json({ error: 'Enter a valid domain, for example mybusiness.com' });
    }
    const clash = store.read().domains.find((d) => d.domain === domain);
    if (clash) return res.status(409).json({ error: `That domain is already connected to ${clash.siteSlug}.` });
  }

  // the internal slug (used for preview routing + storage) always comes from the business name
  const slug = slugify(body.slug || businessName) || slugify(domain);
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'Could not derive an internal slug — pass a business name with letters or numbers.' });
  if (RESERVED.has(slug)) return res.status(409).json({ error: 'That internal slug is reserved.' });
  if (findSite(slug)) return res.status(409).json({ error: 'An internal slug for that name is already taken.' });

  const site = {
    id: uid('site'),
    slug,
    domain: domain || null,
    businessName,
    industry,
    theme,
    description,
    city,
    phone,
    status: 'building',
    phase: 'queued',
    phaseLabel: 'Queued',
    progress: 4,
    views: 0,
    createdAt: now(),
    updatedAt: now()
  };

  store.mutate((db) => { db.sites.push(site); });
  const mapping = domain ? createDomainMapping(site, domain) : null;
  runBuild(slug);
  res.status(201).json({ site: publicSite(site), domain: mapping });
});

app.put('/api/sites/:slug', (req, res) => {
  const db = store.read();
  const site = db.sites.find((s) => s.slug === req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const body = req.body || {};
  if (body.businessName != null) site.businessName = String(body.businessName).trim().slice(0, 80) || site.businessName;
  if (body.description != null) site.description = String(body.description).trim().slice(0, 1200);
  if (body.city != null) site.city = String(body.city).trim().slice(0, 80);
  if (body.phone != null) site.phone = String(body.phone).trim().slice(0, 24);
  if (body.industry != null && INDUSTRIES[body.industry]) site.industry = body.industry;
  if (body.theme != null && THEMES[body.theme]) site.theme = body.theme;

  if (body.domain != null) {
    const next = normalizeDomain(body.domain);
    if (!next) {
      db.domains = db.domains.filter((d) => d.siteSlug !== site.slug);
      site.domain = null;
    } else {
      if (!DOMAIN_RE.test(next)) return res.status(400).json({ error: 'Enter a valid domain, for example mybusiness.com' });
      const clash = db.domains.find((d) => d.domain === next && d.siteSlug !== site.slug);
      if (clash) return res.status(409).json({ error: `That domain is already connected to ${clash.siteSlug}.` });
      site.domain = next;
    }
  }

  site.status = 'building';
  site.progress = 4;
  site.phase = 'queued';
  site.phaseLabel = 'Queued for rebuild';
  site.updatedAt = now();
  store.write(db);

  if (body.domain != null) {
    const next = normalizeDomain(body.domain);
    if (next && !db.domains.some((d) => d.siteSlug === site.slug && d.domain === next)) {
      createDomainMapping(site, next);
    }
  }

  runBuild(site.slug);
  res.json({ site: publicSite(site) });
});

app.delete('/api/sites/:slug', (req, res) => {
  const db = store.read();
  const before = db.sites.length;
  db.sites = db.sites.filter((s) => s.slug !== req.params.slug);
  if (db.sites.length === before) return res.status(404).json({ error: 'Site not found' });
  db.domains = db.domains.filter((d) => d.siteSlug !== req.params.slug);
  store.write(db);
  res.json({ ok: true });
});

/* --------------------------- domains ------------------------------ */
app.get('/api/domains', (req, res) => {
  res.json({ domains: store.read().domains.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')) });
});

app.get('/api/sites/:slug/domain', (req, res) => {
  const domain = store.read().domains.find((d) => d.siteSlug === req.params.slug);
  res.json({ domain: domain || null });
});

app.post('/api/sites/:slug/domain', (req, res) => {
  const site = findSite(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const domain = normalizeDomain((req.body || {}).domain);
  if (!DOMAIN_RE.test(domain)) return res.status(400).json({ error: 'Enter a valid domain, for example mybusiness.com' });

  const clash = store.read().domains.find((d) => d.domain === domain && d.siteSlug !== site.slug);
  if (clash) return res.status(409).json({ error: `That domain is already connected to ${clash.siteSlug}.` });

  const record = createDomainMapping(site, domain);
  res.status(201).json({ domain: record });
});

app.post('/api/sites/:slug/domain/recheck', (req, res) => {
  const db = store.read();
  const record = db.domains.find((d) => d.siteSlug === req.params.slug);
  if (!record) return res.status(404).json({ error: 'No domain mapped to this site' });
  record.status = 'pending';
  record.records.forEach((r) => { r.status = 'pending'; });
  record.ssl = { status: 'pending', issuer: "Let's Encrypt (simulated)", expiresAt: null };
  record.verifiedAt = null;
  record.liveAt = null;
  record.checkedAt = now();
  store.write(db);
  runDomainChecks(record.id);
  res.json({ domain: record });
});

app.delete('/api/sites/:slug/domain', (req, res) => {
  const db = store.read();
  const before = db.domains.length;
  db.domains = db.domains.filter((d) => d.siteSlug !== req.params.slug);
  if (db.domains.length === before) return res.status(404).json({ error: 'No domain mapped' });
  const site = db.sites.find((s) => s.slug === req.params.slug);
  if (site) {
    site.domain = null;
    if (site.html) regenerateHtml(site);
    site.updatedAt = now();
  }
  store.write(db);
  res.json({ ok: true });
});

/* --------------------------- hosting ------------------------------ */
app.get('/sites/:slug', (req, res) => {
  const db = store.read();
  const site = db.sites.find((s) => s.slug === req.params.slug);
  if (!site) {
    return res.status(404).type('html').send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Site not found</title>
      <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b10;color:#e8e8f0;
      font-family:Inter,system-ui,sans-serif;text-align:center;padding:2rem}code{background:#1a1a24;padding:.2rem .5rem;border-radius:6px}</style></head>
      <body><div><h1 style="font-size:1.6rem;margin:0 0 .6rem">No site at this address</h1>
      <p style="color:#9a9ab0;margin:0">Nothing is published at <code>${site ? site.slug : req.params.slug}</code> yet.</p></div></body></html>`);
  }
  if (!site.html || site.status !== 'live') {
    return res.status(503).type('html').send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Building…</title>
      <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b10;color:#e8e8f0;
      font-family:Inter,system-ui,sans-serif;text-align:center}.bar{width:220px;height:4px;border-radius:4px;background:#1e1e2a;overflow:hidden;margin-top:1.2rem}
      .bar i{display:block;height:100%;width:${site.progress || 5}%;background:linear-gradient(90deg,#6366f1,#22d3ee)}</style></head>
      <body><div><h1 style="font-size:1.4rem;margin:0">Building your site…</h1>
      <p style="color:#9a9ab0">${site.phaseLabel || 'Working'}</p><div class="bar"><i></i></div>
      <p style="color:#6b6b85;font-size:.8rem">Refresh in a moment.</p></div></body></html>`);
  }
  site.views = (site.views || 0) + 1;
  store.write(db);
  res.type('html').send(site.html);
});

/* --------------------------- static client ----------------------- */
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`Orbit API listening on http://localhost:${PORT}`);
  console.log(`Dashboard: ${fs.existsSync(clientDist) ? `http://localhost:${PORT}` : 'http://localhost:5173 (vite dev)'}`);
});
