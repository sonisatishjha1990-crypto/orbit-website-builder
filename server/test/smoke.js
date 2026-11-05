'use strict';
/* End-to-end smoke test: boots the API as a child process and walks the full flow. */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 4100;
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
}

async function j(url, opts) {
  const res = await fetch(BASE + url, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

// fetch() cannot override the Host header, so use raw http for host-routing checks
function getAs(host, p = '/') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: p, headers: { Host: host } }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitLive(slug, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const { body } = await j(`/api/sites/${slug}/status`);
    if (body.status === 'live') return body;
    if (body.status === 'error') return body;
    await sleep(300);
  }
  return { status: 'timeout' };
}

async function waitDomain(slug, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const { body } = await j(`/api/sites/${slug}/domain`);
    if (body.domain && body.domain.status === 'live') return body.domain;
    await sleep(300);
  }
  return null;
}

(async () => {
  const dbFile = path.join(__dirname, '..', 'data', 'db.json');
  if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

  const child = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'index.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d.toString(); });
  child.stderr.on('data', (d) => { out += d.toString(); });

  try {
    // wait for boot
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch(BASE + '/api/health');
        if (r.ok) break;
      } catch { /* not up yet */ }
      await sleep(200);
    }

    const health = await j('/api/health');
    check('health endpoint', health.status === 200 && health.body.ok === true);

    const meta = await j('/api/meta');
    check('meta returns industries + themes',
      meta.body.industries.length >= 9 && meta.body.themes.length === 5,
      `${meta.body.industries.length} industries, ${meta.body.themes.length} themes`);

    const free = await j('/api/subdomains/check?slug=kavis-bakehouse');
    check('subdomain available', free.body.available === true);

    const reserved = await j('/api/subdomains/check?slug=admin');
    check('reserved subdomain blocked', reserved.body.available === false, reserved.body.reason);

    const created = await j('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: "Kavi's Bakehouse",
        industry: 'bakery',
        theme: 'sunset',
        description: 'A neighbourhood bakery doing naturally leavened bread and custom cakes since 2014.',
        city: 'Pune, India',
        domain: 'kavisbakehouse.com'
      })
    });
    check('create site with own domain', created.status === 201 && created.body.site.domain === 'kavisbakehouse.com',
      created.body.site && created.body.site.host);
    check('domain mapping auto-created', created.body.domain && created.body.domain.records.length === 3);
    check('site url is the custom domain', created.body.site.url === 'https://kavisbakehouse.com');
    check('create site', created.status === 201 && created.body.site.slug === 'kavi-s-bakehouse',
      created.body.site && created.body.site.slug);

    const dup = await j('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: 'Dup', industry: 'bakery', theme: 'aurora', slug: 'kavi-s-bakehouse' })
    });
    check('duplicate subdomain rejected', dup.status === 409);

    const live = await waitLive('kavi-s-bakehouse');
    check('build reaches live', live.status === 'live', live.phaseLabel || '');

    const page = await fetch(BASE + '/sites/kavi-s-bakehouse');
    const html = await page.text();
    check('site served over subdomain route', page.status === 200 && html.includes("Kavi's Bakehouse"));
    check('generated site uses the custom domain', html.includes('hello@kavisbakehouse.com'));
    check('generated html is self-contained', !/src="http/.test(html) && html.includes('<style>'), `${Math.round(html.length / 1024)} KB`);
    check('description used in page', html.includes('naturally leavened bread'));
    check('theme colour applied', html.includes('#ea580c'));

    const missing = await fetch(BASE + '/sites/nope');
    check('unknown subdomain 404s', missing.status === 404);

    const badDom = await j('/api/sites/kavi-s-bakehouse/domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'not a domain' })
    });
    check('invalid domain rejected', badDom.status === 400);

    const domLive = await waitDomain('kavi-s-bakehouse');
    check('dns + ssl pipeline reaches live', !!domLive && domLive.ssl.status === 'active');

    const viaHost = await getAs('kavisbakehouse.com');
    check('custom domain host routing serves site', viaHost.status === 200 && viaHost.body.includes("Kavi's Bakehouse"));

    const viaSub = await getAs('kavi-s-bakehouse.orbit.local');
    check('wildcard subdomain host routing works', viaSub.status === 200 && viaSub.body.includes("Kavi's Bakehouse"));

    const put = await j('/api/sites/kavi-s-bakehouse', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'emerald', businessName: 'Kavi Bakehouse' })
    });
    check('update triggers rebuild', put.status === 200 && put.body.site.status === 'building');
    await waitLive('kavi-s-bakehouse');
    const rebuilt = await (await fetch(BASE + '/sites/kavi-s-bakehouse')).text();
    check('rebuild applies new theme', rebuilt.includes('#0f9f6e'));

    const stats = await j('/api/stats');
    check('stats aggregate', stats.body.sites === 1 && stats.body.views >= 2, JSON.stringify(stats.body));

    const del = await j('/api/sites/kavi-s-bakehouse', { method: 'DELETE' });
    const afterDel = await fetch(BASE + '/sites/kavi-s-bakehouse');
    check('delete removes site + domain', del.status === 200 && afterDel.status === 404);

    const dash = await fetch(BASE + '/');
    const dashHtml = await dash.text();
    check('dashboard SPA served', dash.status === 200 && dashHtml.includes('id="root"'));
  } catch (err) {
    check('smoke run', false, err.message);
  } finally {
    child.kill('SIGTERM');
    await sleep(300);
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    if (out.includes('Error')) console.log('--- server log ---\n' + out.split('\n').slice(-15).join('\n'));
    process.exit(failed.length ? 1 : 0);
  }
})();
