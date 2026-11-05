/* Orbit builder — standalone browser demo.
   Same generator as the server, same state machines, persistence in localStorage. */
(function () {
  'use strict';

  var GEN = window.OrbitGen;
  var KEY = 'orbit-demo-db-v1';
  var RESERVED = ['www', 'api', 'app', 'admin', 'mail', 'dashboard', 'orbit', 'static', 'cdn', 'assets', 'dev', 'staging', 'sites', 'docs', 'status', 'blog', 'support'];
  var PHASES = [
    { key: 'analyze', label: 'Reading business details' },
    { key: 'copy', label: 'Writing copy and structure' },
    { key: 'layout', label: 'Composing responsive layout' },
    { key: 'style', label: 'Applying theme and type' },
    { key: 'publish', label: 'Publishing to edge network' }
  ];

  /* ------------------------------------------------------------------ state */
  var db = loadDb();
  var timers = [];

  var ui = {
    view: 'dashboard',
    slug: null,
    tab: 'preview',
    device: 'desktop',
    step: 'details',
    seedSlug: '',
    form: { businessName: '', industry: 'bakery', theme: 'aurora', description: '', city: 'Bengaluru, India', phone: '', domain: '' },
    mode: 'domain',
    dashDomain: '',
    slugTouched: false,
    check: null,
    submitting: false,
    liveDomain: null
  };

  function loadDb() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && Array.isArray(raw.sites)) return raw;
    } catch (e) { /* corrupted store: start clean */ }
    return { sites: [], domains: [] };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* quota */ }
  }

  function uid(p) { return p + '_' + Math.random().toString(36).slice(2, 10); }
  function now() { return new Date().toISOString(); }
  function findSite(slug) { return db.sites.filter(function (s) { return s.slug === slug; })[0] || null; }
  function findDomain(slug) { return db.domains.filter(function (d) { return d.siteSlug === slug; })[0] || null; }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function attr(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

  /* icons */
  var ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    external: '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h8"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 5v6h-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/>',
    zap: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    rocket: '<path d="M5 15c-1.5 1.5-1.5 5 0 5s3.5 0 5-1.5"/><path d="M14.5 4.5C18 3 21 3 21 3s0 3-1.5 6.5C17.5 14 12 18 12 18l-6-6s4-5.5 8.5-7.5z"/><circle cx="15.5" cy="8.5" r="1.6"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 007.5 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 15H3a2 2 0 110-4h.1A1.6 1.6 0 004.6 8.5l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 5.6V5a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>',
    desktop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
    mobile: '<rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M11 18h2"/>',
    link: '<path d="M10 13a5 5 0 007.1 0l1.9-1.9a5 5 0 00-7.1-7.1L10.5 5.4"/><path d="M14 11a5 5 0 00-7.1 0L5 12.9a5 5 0 007.1 7.1l1.4-1.4"/>',
    lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>'
  };

  function ic(name, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.sparkles) + '</svg>';
  }

  function toast(message, type) {
    var wrap = document.getElementById('toast-wrap');
    wrap.innerHTML = '<div class="toast' + (type === 'err' ? ' err' : '') + '">' + ic(type === 'err' ? 'alert' : 'check', 15) + esc(message) + '</div>';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { wrap.innerHTML = ''; }, 3200);
  }

  /* ------------------------------------------------------------------ router */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (parts[0] === 'new') return { view: 'create' };
    if (parts[0] === 'site' && parts[1]) return { view: 'detail', slug: parts[1] };
    if (parts[0] === 's' && parts[1]) return { view: 'live', slug: parts[1], via: 'sub' };
    if (parts[0] === 'd' && parts[1]) return { view: 'liveDomain', domain: decodeURIComponent(parts[1]) };
    return { view: 'dashboard' };
  }

  function route() {
    var r = parseHash();
    if (r.view !== 'live' && r.view !== 'liveDomain') {
      ui.view = r.view;
      if (r.view === 'detail') ui.slug = r.slug;
      if (r.view === 'create' && ui.step !== 'build' && ui.step !== 'done') ui.step = ui.step || 'details';
    } else {
      ui.view = r.view;
    }
    render();
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  /* ------------------------------------------------------------------ build pipeline */
  function startBuild(slug) {
    var site = findSite(slug);
    if (!site) return;
    site.status = 'building';
    site.progress = 4;
    site.phase = 'analyze';
    site.phaseLabel = PHASES[0].label;
    site.updatedAt = now();
    save();

    var i = 0;
    var t = setInterval(function () {
      var s = findSite(slug);
      if (!s) { clearInterval(t); return; }
      if (i < PHASES.length) {
        s.phase = PHASES[i].key;
        s.phaseLabel = PHASES[i].label;
        s.progress = Math.round(((i + 0.7) / PHASES.length) * 100);
        s.status = 'building';
        save();
        i += 1;
        paint();
        return;
      }
      clearInterval(t);
      s.html = GEN.buildSite({
        businessName: s.businessName,
        industry: s.industry,
        theme: s.theme,
        description: s.description,
        city: s.city,
        phone: s.phone,
        slug: s.slug,
        domain: (findDomain(s.slug) || {}).domain
      });
      s.status = 'live';
      s.phase = 'done';
      s.phaseLabel = 'Published';
      s.progress = 100;
      s.publishedAt = now();
      s.sizeKb = Math.round(new Blob([s.html]).size / 1024);
      save();
      paint();
      if (ui.step === 'build' && ui.slug === s.slug) {
        ui.step = 'done';
        paint();
        toast('Published at ' + s.slug + '.orbit.local');
      }
    }, 720);
    timers.push(t);
  }

  function startDomainChecks(domainId) {
    var steps = [
      { after: 900, fn: function (d) { d.status = 'verifying'; d.records.forEach(function (r) { r.status = 'checking'; }); } },
      { after: 2100, fn: function (d) { d.status = 'verified'; d.records.forEach(function (r) { r.status = 'verified'; }); d.verifiedAt = now(); } },
      { after: 3400, fn: function (d) { d.status = 'ssl_provisioning'; d.ssl.status = 'issuing'; } },
      { after: 5000, fn: function (d) {
        d.status = 'live';
        d.ssl.status = 'active';
        d.ssl.issuedAt = now();
        d.ssl.expiresAt = new Date(Date.now() + 90 * 864e5).toISOString();
        d.liveAt = now();
        var s = findSite(d.siteSlug);
        if (s) {
          s.html = GEN.buildSite({
            businessName: s.businessName, industry: s.industry, theme: s.theme,
            description: s.description, city: s.city, phone: s.phone, slug: s.slug, domain: d.domain
          });
          save();
        }
      } }
    ];
    steps.forEach(function (step) {
      timers.push(setTimeout(function () {
        var d = db.domains.filter(function (x) { return x.id === domainId; })[0];
        if (!d) return;
        step.fn(d);
        d.checkedAt = now();
        save();
        paint();
      }, step.after));
    });
  }

  /* ------------------------------------------------------------------ render */
  var app = document.getElementById('app');

  function paint() {
    app.innerHTML = ui.view === 'live' || ui.view === 'liveDomain' ? renderLive() : renderShell();
    if (ui.view === 'live' || ui.view === 'liveDomain') return;
    var scroller = document.getElementById('main');
    if (scroller) scroller.scrollTop = 0;
  }

  function render() {
    paint();
  }

  function renderLive() {
    var site = null;
    var label = '';
    if (ui.view === 'live') {
      site = findSite(ui.slug);
      label = ui.slug + '.orbit.local';
    } else {
      var d = db.domains.filter(function (x) { return x.domain === ui.liveDomain; })[0];
      site = d ? findSite(d.siteSlug) : null;
      label = ui.liveDomain;
    }
    if (!site || !site.html) {
      return '<div class="live-shell"><div class="live-bar"><button class="btn ghost sm" data-action="back">' + ic('arrowLeft', 14) + ' Back to dashboard</button><div class="spacer"></div></div>' +
        '<div class="empty" style="margin:auto"><div class="ico">' + ic('alert', 22) + '</div><h3>Nothing hosted at this address</h3><p>That hostname is not mapped to a published site.</p></div></div>';
    }
    return '<div class="live-shell">' +
      '<div class="live-bar">' +
        '<button class="btn ghost sm" data-action="back">' + ic('arrowLeft', 14) + ' Dashboard</button>' +
        '<span class="url">' + ic('lock', 11) + esc(label) + '</span>' +
        '<span class="badge live"><span class="dot"></span>Served from Orbit</span>' +
        '<div class="spacer"></div>' +
        '<button class="btn ghost sm" data-action="manage" data-slug="' + attr(site.slug) + '">' + ic('settings', 13) + ' Manage</button>' +
      '</div>' +
      '<iframe title="' + attr(site.businessName) + '" srcdoc="' + attr(site.html) + '" sandbox="allow-scripts allow-forms allow-popups allow-modals"></iframe>' +
    '</div>';
  }

  function renderShell() {
    return '<div class="layout">' + renderSidebar() + '<div class="main" id="main">' + renderView() + '</div></div>';
  }

  function renderSidebar() {
    var live = db.sites.filter(function (s) { return s.status === 'live'; }).length;
    var domainsLive = db.domains.filter(function (d) { return d.status === 'live'; }).length;
    var navItem = function (id, label, icon, extra) {
      var on = (id === 'dashboard' && (ui.view === 'dashboard' || ui.view === 'detail')) || (id === 'new' && ui.view === 'create');
      return '<button data-action="nav" data-view="' + id + '" class="' + (on ? 'active' : '') + '">' + ic(icon, 17) + label + (extra || '') + '</button>';
    };
    return '<aside class="side">' +
      '<div class="brand"><span class="mark">' + ic('globe', 18) + '</span><div><strong>Orbit</strong><small>Website builder</small></div></div>' +
      '<nav class="nav">' +
        navItem('dashboard', 'Dashboard', 'grid') +
        navItem('new', 'New website', 'sparkles') +
        '<button data-action="nav" data-view="dashboard">' + ic('layers', 17) + 'My websites<span class="count">' + db.sites.length + '</span></button>' +
      '</nav>' +
      '<div class="usage"><h4>Usage</h4><div class="box">' +
        '<div class="row"><span>Sites live</span><b>' + live + '</b></div>' +
        '<div class="bar"><i style="width:' + Math.min(100, live * 10) + '%"></i></div>' +
        '<div class="row" style="margin-top:8px"><span>Domains</span><b>' + domainsLive + '</b></div>' +
      '</div></div>' +
      '<div class="side-foot"><button class="btn primary wide" data-action="nav" data-view="new">' + ic('plus', 15) + ' Build a website</button>' +
        '<p>Runs entirely in this browser. Generation is template-based — no external AI calls, no server needed.</p></div>' +
    '</aside>';
  }

  function renderView() {
    if (ui.view === 'create') return renderCreate();
    if (ui.view === 'detail') return renderDetail();
    return renderDashboard();
  }

  /* ---------------------------------------------------------- dashboard */
  function renderDashboard() {
    var sites = db.sites.slice().sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    var live = sites.filter(function (s) { return s.status === 'live'; }).length;
    var views = sites.reduce(function (n, s) { return n + (s.views || 0); }, 0);
    var domainsLive = db.domains.filter(function (d) { return d.status === 'live'; }).length;

    var stats = [
      { icon: 'layers', label: 'Websites', value: sites.length, hint: 'total' },
      { icon: 'zap', label: 'Live', value: live, hint: 'published' },
      { icon: 'globe', label: 'Domains', value: domainsLive, hint: db.domains.length + ' mapped' },
      { icon: 'eye', label: 'Visits', value: views, hint: 'all sites' }
    ].map(function (s) {
      return '<div class="stat"><span class="ico">' + ic(s.icon, 15) + '</span><b>' + s.value + '</b><span>' + s.label + '</span></div>';
    }).join('');

    var cards = sites.map(function (site) {
      var tone = site.status === 'live' ? 'live' : site.status === 'building' ? 'building' : 'error';
      var label = site.status === 'live' ? 'Live' : site.status === 'building' ? site.progress + '%' : 'Error';
      return '<div class="site-card">' +
        '<div class="site-thumb"><span class="slug">' + esc(site.domain || site.slug + '.orbit.local') + '</span>' +
          '<span class="status badge ' + tone + '"><span class="dot"></span>' + label + '</span></div>' +
        '<div class="site-body">' +
          '<h3>' + esc(site.businessName) + '</h3>' +
          '<div class="meta">' + esc(site.industry) + ' · ' + esc(site.theme) + ' theme' + (site.domain ? '' : ' · no domain') + '</div>' +
          '<div class="site-actions">' +
            '<button class="btn ghost sm" data-action="open-live" data-slug="' + attr(site.slug) + '"' + (site.status !== 'live' ? ' disabled' : '') + '>' + ic('external', 13) + ' Preview</button>' +
            '<button class="btn primary sm" data-action="manage" data-slug="' + attr(site.slug) + '">' + ic('settings', 13) + ' Manage</button>' +
          '</div>' +
        '</div></div>';
    }).join('');

    var domainRows = db.domains.map(function (d) {
      return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--line);font-size:12px">' +
        ic('globe', 14) + '<span style="font-weight:600">' + esc(d.domain) + '</span>' +
        '<span class="mono" style="color:var(--dim);font-size:10.5px">→ ' + esc(d.target) + '</span>' +
        '<span style="margin-left:auto;display:flex;gap:8px;align-items:center">' +
          '<span class="badge ' + (d.status === 'live' ? 'live' : d.status === 'pending' ? '' : 'building') + '">' + esc(d.status.replace('_', ' ')) + '</span>' +
          '<button class="link-btn" data-action="manage" data-slug="' + attr(d.siteSlug) + '">Manage</button>' +
        '</span></div>';
    }).join('');

    var dashLine = ui.dashDomain && !validDomain(ui.dashDomain)
      ? '<p class="note" style="color:#fda4af">That does not look like a domain — try mybusiness.com</p>'
      : '<p class="note">We create the A, CNAME and TXT records, run the SSL checks and track the status until it resolves. No domain yet? Pick a free Orbit address inside the builder.</p>';

    return '' +
      '<div class="page-head"><div><h1>Dashboard</h1><p>Describe a business, connect your domain, publish in under a minute.</p></div>' +
        '<button class="btn primary" data-action="nav" data-view="new">' + ic('sparkles', 15) + ' Generate a website</button></div>' +
      '<div class="stats">' + stats + '</div>' +
      '<section class="card search-card">' +
        '<div class="kicker">' + ic('globe', 12) + ' Publish on your own domain</div>' +
        '<h2>Which domain should this site live on?</h2>' +
        '<div class="search-row">' +
          '<div class="field-wrap"><input id="dash-domain" placeholder="mybusiness.com" value="' + attr(ui.dashDomain) + '" autocomplete="off" /></div>' +
          '<button class="btn primary" data-action="dash-domain-start">' + ic('arrowRight', 15) + ' Start with this domain</button>' +
        '</div>' + dashLine +
      '</section>' +
      '<div class="section-title"><h2>Your websites</h2><button class="link-btn" data-action="refresh">Refresh</button></div>' +
      (sites.length
        ? '<div class="grid">' + cards + '</div>'
        : '<div class="card empty"><div class="ico">' + ic('rocket', 22) + '</div><h3>No websites yet</h3><p>Add a business name, pick an industry and theme, and Orbit writes a complete responsive site for you.</p><button class="btn primary" data-action="nav" data-view="new">' + ic('plus', 15) + ' Create your first site</button></div>') +
      (db.domains.length ? '<div class="card" style="margin-top:20px;overflow:hidden"><div style="display:flex;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--line)"><b style="font-size:12.5px">Custom domains</b><span style="font-size:11px;color:var(--dim)">' + db.domains.length + ' mapped</span></div>' + domainRows + '</div>' : '') +
      '<p class="note" style="text-align:center;margin-top:22px">Generation runs locally in this browser — no third-party AI calls.</p>';
  }

  /* ---------------------------------------------------------- create wizard */
  function slugify(v) { return GEN.slugify(v); }

  var DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

  function cleanDomain(v) {
    return String(v || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '').trim();
  }

  function validDomain(v) {
    var d = cleanDomain(v);
    var parts = d.split('.');
    return DOMAIN_RE.test(d) && parts.length >= 2 && parts[parts.length - 1].length >= 2;
  }

  /** Connect a domain to a site: records, SSL placeholder, and the status pipeline. */
  function attachDomain(site, domain) {
    db.domains = db.domains.filter(function (d) { return d.siteSlug !== site.slug; });
    var rec = {
      id: uid('dom'),
      siteSlug: site.slug,
      domain: domain,
      target: site.slug + '.orbit.local',
      status: 'pending',
      records: [
        { type: 'A', name: '@', value: '76.76.21.21', ttl: '3600', status: 'pending' },
        { type: 'CNAME', name: 'www', value: site.slug + '.orbit.local', ttl: '3600', status: 'pending' },
        { type: 'TXT', name: '_orbit-verify', value: 'orbit-verify=' + Math.random().toString(36).slice(2, 14), ttl: '300', status: 'pending' }
      ],
      ssl: { status: 'pending', issuer: "Let's Encrypt (simulated)", expiresAt: null },
      createdAt: now(), checkedAt: null, verifiedAt: null, liveAt: null
    };
    db.domains.push(rec);
    site.domain = domain;
    save();
    startDomainChecks(rec.id);
    return rec;
  }

  function checkSlug(slug) {
    if (!slug || slug.length < 2) return { available: false, slug: slug, reason: 'Use 2–40 lowercase letters, numbers or hyphens.' };
    if (RESERVED.indexOf(slug) > -1) return { available: false, slug: slug, reason: 'That subdomain is reserved by the platform.' };
    if (findSite(slug)) return { available: false, slug: slug, reason: 'Already taken by another site.' };
    return { available: true, slug: slug, reason: 'Available — it is yours.' };
  }

  function stepper(step) {
    var labels = ['Details', ui.mode === 'subdomain' ? 'Address' : 'Domain', 'Publish'];
    var current = step === 'details' ? 0 : step === 'address' ? 1 : 2;
    return '<div class="stepper">' + labels.map(function (l, i) {
      var cls = i < current ? 'done' : i === current ? 'on' : '';
      return '<div class="step ' + cls + '"><i>' + (i < current ? ic('check', 10) : i + 1) + '</i><span>' + l + '</span></div>' +
        (i < labels.length - 1 ? '<span class="step-line"></span>' : '');
    }).join('') + '</div>';
  }

  function renderCreate() {
    if (ui.step === 'build' || ui.step === 'done') return renderBuildOrResult();

    var industries = Object.keys(GEN.INDUSTRIES).map(function (k) { return { id: k, label: GEN.INDUSTRIES[k].label }; });
    var themes = Object.keys(GEN.THEMES).map(function (k) { return { id: k, label: GEN.THEMES[k].label, accent: GEN.THEMES[k].accent, accent2: GEN.THEMES[k].accent2 }; });

    var industryPills = industries.map(function (i) {
      return '<button class="pill ' + (ui.form.industry === i.id ? 'on' : '') + '" data-action="industry" data-id="' + i.id + '">' + esc(i.label) + '</button>';
    }).join('');

    var themePills = themes.map(function (t) {
      return '<button class="pill ' + (ui.form.theme === t.id ? 'on' : '') + '" data-action="theme" data-id="' + t.id + '">' +
        '<span class="swatch" style="background:linear-gradient(135deg,' + t.accent + ',' + t.accent2 + ')"></span>' + esc(t.label) + '</button>';
    }).join('');

    var selected = themes.filter(function (t) { return t.id === ui.form.theme; })[0] || themes[0];
    var industryLabel = (industries.filter(function (i) { return i.id === ui.form.industry; })[0] || {}).label || '—';

    var brief = '<div class="card sticky"><div style="padding:12px 16px;border-bottom:1px solid var(--line);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);font-weight:700">Live brief</div>' +
      '<div class="pad">' +
        '<div style="height:104px;border-radius:12px;position:relative;overflow:hidden;background:linear-gradient(135deg,' + selected.accent + ',' + selected.accent2 + ')">' +
          '<div style="position:absolute;inset:0;background:radial-gradient(circle at 72% 18%,rgba(255,255,255,.55),transparent 55%)"></div>' +
          '<div style="position:absolute;left:10px;right:10px;bottom:10px;background:rgba(255,255,255,.95);border-radius:8px;padding:6px 9px;font-size:11px;font-weight:700;color:#0d1220;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(ui.form.businessName || 'Your business name') + '</div>' +
        '</div>' +
        '<dl class="kv" style="margin-top:16px">' +
          '<div><dt>Industry</dt><dd>' + esc(industryLabel) + '</dd></div>' +
          '<div><dt>Theme</dt><dd style="display:flex;align-items:center;gap:6px;justify-content:flex-end"><span style="width:11px;height:11px;border-radius:50%;background:' + selected.accent + '"></span>' + esc(selected.label) + '</dd></div>' +
          '<div><dt>Address</dt><dd class="mono">' + esc(ui.form.slug || slugify(ui.form.businessName) || '—') + '.orbit.local</dd></div>' +
          '<div><dt>Sections</dt><dd style="max-width:58%;text-align:right">Hero · Services · About · Reviews · Contact</dd></div>' +
        '</dl>' +
        '<div style="margin-top:16px;border:1px solid var(--line);border-radius:10px;background:rgba(20,20,29,.6);padding:11px;font-size:10.5px;line-height:1.6;color:var(--dim)">Generated fully offline from templates — no OpenAI or third-party API is contacted.</div>' +
      '</div></div>';

    var body;
    if (ui.step === 'details') {
      body = '<div class="rise">' +
        '<div class="field"><label class="label">Business name</label><input class="input" id="f-name" value="' + attr(ui.form.businessName) + '" placeholder="e.g. Kavi\'s Bakehouse" autocomplete="off" /></div>' +
        '<div class="field"><span class="label">Industry</span><div class="grid-industry">' + industryPills + '</div></div>' +
        '<div class="field"><span class="label">Theme</span><div class="pill-group">' + themePills + '</div></div>' +
        '<div class="field"><label class="label">What do you do?</label><textarea class="input" id="f-desc" placeholder="A neighbourhood bakery doing naturally leavened bread and custom cakes, open Tuesday to Sunday.">' + esc(ui.form.description) + '</textarea>' +
          '<p class="note">Two or three sentences. This becomes the About section — leave it blank and the industry default is used.</p></div>' +
        '<div class="form-row two">' +
          '<div class="field"><label class="label">City (optional)</label><input class="input" id="f-city" value="' + attr(ui.form.city) + '" /></div>' +
          '<div class="field"><label class="label">Phone (optional)</label><input class="input" id="f-phone" value="' + attr(ui.form.phone) + '" placeholder="+91 80 4000 1234" /></div>' +
        '</div>' +
        '<div class="divider"></div>' +
        '<div class="actions"><button class="link-btn" data-action="nav" data-view="dashboard">Cancel</button>' +
          '<button class="btn primary" data-action="to-address">Continue ' + ic('arrowRight', 14) + '</button></div>' +
      '</div>';
    } else {
      var slugValue = ui.form.slug || slugify(ui.form.businessName);
      var check = ui.check;
      var isDomain = ui.mode === 'domain';
      var dOk = validDomain(ui.form.domain);

      var modeToggle = '<div class="search-row" style="margin:0 0 16px;gap:6px">' +
        '<button class="pill ' + (isDomain ? 'on' : '') + '" data-action="mode" data-mode="domain" style="flex:1;justify-content:center">' + ic('globe', 13) + ' My own domain</button>' +
        '<button class="pill ' + (!isDomain ? 'on' : '') + '" data-action="mode" data-mode="subdomain" style="flex:1;justify-content:center">' + ic('link', 13) + ' Free Orbit address</button>' +
      '</div>';

      var domainHint = !ui.form.domain
        ? '<span style="color:var(--dim)">The domain you already own — apex or subdomain, both work.</span>'
        : dOk
          ? '<span class="hint-line ok" style="margin:0">' + ic('check', 13) + esc(cleanDomain(ui.form.domain)) + ' will be the live address</span>'
          : '<span class="hint-line bad" style="margin:0">' + ic('alert', 13) + 'That does not look like a domain — try mybusiness.com</span>';

      var domainBlock = '<div class="field"><span class="label">Your domain</span>' +
          '<div class="search-row" style="margin-top:0"><div class="field-wrap"><input id="f-site-domain" value="' + attr(ui.form.domain) + '" placeholder="mybusiness.com" autocomplete="off" /></div></div>' +
          '<div style="margin-top:8px;min-height:18px;font-size:11.5px">' + domainHint + '</div></div>' +
        '<div style="border:1px solid var(--line);border-radius:12px;background:rgba(20,20,29,.5);padding:14px">' +
          '<p style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);font-weight:700">What we set up for you</p>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px;font-size:11.5px;color:var(--dim)">' +
            ['A record for the apex', 'CNAME for www', 'TXT record for ownership', 'SSL for apex and www', 'DNS + SSL status tracker', 'Re-check any time'].map(function (t) {
              return '<span style="display:flex;gap:6px;align-items:center">' + ic('check', 12) + esc(t) + '</span>';
            }).join('') +
          '</div>' +
          '<p class="note" style="margin-top:10px">We generate the exact records to paste at your registrar (GoDaddy, Namecheap, Cloudflare, BigRock…) and watch them until they resolve.</p>' +
        '</div>';

      var subLine = !check
        ? '<span style="color:var(--dim)">Checking…</span>'
        : check.available
          ? '<span class="hint-line ok" style="margin:0">' + ic('check', 13) + 'Available — it is yours.</span>'
          : '<span class="hint-line bad" style="margin:0">' + ic('alert', 13) + esc(check.reason) + '</span>';

      var subBlock = '<div class="field"><span class="label">Your Orbit address</span>' +
          '<div class="search-row" style="margin-top:0"><div class="field-wrap"><input id="f-slug" value="' + attr(slugValue) + '" placeholder="my-business" autocomplete="off" /><span class="suffix">.orbit.local</span></div></div>' +
          '<div style="margin-top:8px;min-height:18px;font-size:11.5px">' + subLine + '</div></div>' +
        '<p class="note">No domain yet? Start here and connect a domain later from the Domain tab — the records and certificate are handled the same way.</p>';

      var canBuild = isDomain ? dOk : (check && check.available);

      body = '<div class="rise">' + modeToggle + (isDomain ? domainBlock : subBlock) +
        '<div class="divider"></div>' +
        '<div class="actions"><button class="btn ghost sm" data-action="to-details">' + ic('arrowLeft', 13) + ' Back</button>' +
          '<button class="btn primary" data-action="build"' + (canBuild ? '' : ' disabled') + '>' + ic('sparkles', 15) + (isDomain ? ' Generate & connect domain' : ' Generate website') + '</button></div>' +
      '</div>';
    }

    return '<div class="page-head"><div><h1>New website</h1><p>Three steps: describe the business, connect your domain, publish.</p></div>' + stepper(ui.step) + '</div>' +
      '<div class="wizard"><div class="card pad">' + body + '</div>' + brief + '</div>';
  }

  function renderBuildOrResult() {
    var site = findSite(ui.slug);
    if (!site) { ui.step = 'details'; return renderCreate(); }

    if (ui.step === 'build') {
      var activeIdx = PHASES.map(function (p) { return p.key; }).indexOf(site.phase);
      var list = PHASES.map(function (p, i) {
        var done = i < activeIdx || site.progress >= 100;
        var active = i === activeIdx && site.progress < 100;
        return '<div class="phase ' + (done ? 'done' : active ? 'active' : '') + '"><i>' + (done ? ic('check', 10) : active ? '<span class="spinner"></span>' : '') + '</i>' + esc(p.label) + (done ? '<span class="tail">done</span>' : '') + '</div>';
      }).join('');

      return '<div style="max-width:660px;margin:0 auto">' + stepper('build') +
        '<div class="card" style="margin-top:20px;overflow:hidden">' +
          '<div class="build-hero"><div class="orbit-spin"></div>' +
            '<h2>Generating ' + esc(site.businessName) + '</h2><p>' + esc(site.phaseLabel || 'Queued') + '…</p></div>' +
          '<div class="pad">' +
            '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--dim);font-weight:600"><span>Build pipeline</span><span class="mono">' + site.progress + '%</span></div>' +
            '<div class="bar" style="margin-top:8px;height:8px"><i style="width:' + Math.max(4, site.progress) + '%"></i></div>' +
            '<div class="phase-list">' + list + '</div>' +
          '</div></div></div>';
    }

    // done
    var url = site.domain || (site.slug + '.orbit.local');
    var domainBanner = site.domain
      ? '<div class="card" style="border-color:rgba(99,102,241,.35);background:rgba(99,102,241,.08);padding:13px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:center;font-size:12px;color:#c7d2fe">' +
          ic('globe', 15) + '<span style="flex:1"><b>' + esc(site.domain) + '</b> is connected. Add the three DNS records at your registrar — verification and SSL are running now, and the site answers on that domain once they resolve.</span>' +
          '<button class="btn ghost sm" data-action="manage" data-slug="' + attr(site.slug) + '">View records</button></div>'
      : '';
    return '<div class="page-head"><div>' +
        '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap"><h1>' + esc(site.businessName) + '</h1><span class="badge live"><span class="dot"></span>Live</span></div>' +
        '<p class="mono" style="margin-top:6px">' + esc(url) + ' · ' + site.sizeKb + ' KB</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn ghost" data-action="download">' + ic('code', 14) + ' Download site file</button>' +
          '<button class="btn ghost" data-action="open-live" data-slug="' + attr(site.slug) + '">' + ic('external', 14) + ' Open live site</button>' +
          '<button class="btn primary" data-action="manage" data-slug="' + attr(site.slug) + '">' + ic('globe', 14) + (site.domain ? ' DNS & SSL status' : ' Connect a domain') + '</button>' +
        '</div></div>' +
      domainBanner +
      '<div class="card" style="overflow:hidden">' +
        '<div class="chrome"><span class="lights"><i style="background:rgba(251,113,133,.7)"></i><i style="background:rgba(251,191,36,.7)"></i><i style="background:rgba(52,211,153,.7)"></i></span>' +
          '<span class="url">' + ic('lock', 11) + esc(url) + '</span>' +
          '<span class="tools"><button class="icon-btn ' + (ui.device === 'desktop' ? 'on' : '') + '" data-action="device" data-device="desktop">' + ic('desktop', 14) + '</button>' +
          '<button class="icon-btn ' + (ui.device === 'mobile' ? 'on' : '') + '" data-action="device" data-device="mobile">' + ic('mobile', 14) + '</button></span></div>' +
        '<div class="preview-stage ' + (ui.device === 'mobile' ? 'mobile' : '') + '"><iframe title="preview" srcdoc="' + attr(site.html) + '" sandbox="allow-scripts allow-forms allow-popups allow-modals"></iframe></div>' +
      '</div>' +
      '<div class="actions" style="margin-top:16px"><button class="btn ghost sm" data-action="new-again">' + ic('plus', 13) + ' Build another site</button>' +
        '<button class="link-btn" data-action="nav" data-view="dashboard">Back to dashboard</button></div>' +
      '<p class="note" style="text-align:center;margin-top:6px">The whole website is one file. Download it and upload it to any hosting — Hostinger, GoDaddy, Netlify or GitHub Pages — and it works as it is.</p>';
  }

  /* ---------------------------------------------------------- site detail */
  function renderDetail() {
    var site = findSite(ui.slug);
    if (!site) {
      return '<div class="card empty"><div class="ico">' + ic('alert', 22) + '</div><h3>Site not found</h3><button class="btn primary" data-action="nav" data-view="dashboard">Back to dashboard</button></div>';
    }
    var domain = findDomain(site.slug);
    var tone = site.status === 'live' ? 'live' : site.status === 'building' ? 'building' : 'error';
    var tabs = [['preview', 'Preview', 'eye'], ['domain', 'Domain & DNS', 'globe'], ['source', 'Source', 'code'], ['settings', 'Settings', 'settings']];

    var body = '';
    if (ui.tab === 'preview') {
      var host = domain && domain.status === 'live' ? domain.domain : site.slug + '.orbit.local';
      body = '<div class="card" style="overflow:hidden">' +
        '<div class="chrome"><span class="lights"><i style="background:rgba(251,113,133,.7)"></i><i style="background:rgba(251,191,36,.7)"></i><i style="background:rgba(52,211,153,.7)"></i></span>' +
          '<span class="url">' + ic('lock', 11) + esc(host) + '</span>' +
          '<span class="tools">' +
            '<button class="icon-btn ' + (ui.device === 'desktop' ? 'on' : '') + '" data-action="device" data-device="desktop">' + ic('desktop', 14) + '</button>' +
            '<button class="icon-btn ' + (ui.device === 'mobile' ? 'on' : '') + '" data-action="device" data-device="mobile">' + ic('mobile', 14) + '</button>' +
            '<button class="icon-btn" data-action="repaint">' + ic('refresh', 14) + '</button>' +
          '</span></div>' +
        '<div class="preview-stage ' + (ui.device === 'mobile' ? 'mobile' : '') + '"><iframe title="preview" srcdoc="' + attr(site.html || '') + '" sandbox="allow-scripts allow-forms allow-popups allow-modals"></iframe></div>' +
      '</div>';
    } else if (ui.tab === 'domain') {
      body = renderDomainPanel(site, domain);
    } else if (ui.tab === 'source') {
      body = '<div class="card" style="overflow:hidden">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap">' +
          '<span class="mono" style="font-size:10.5px;color:var(--dim)">' + esc(site.slug) + '/index.html · self-contained</span>' +
          '<span style="display:flex;gap:8px"><button class="copy" data-action="copy" data-value="html">Copy HTML</button>' +
          '<button class="copy" data-action="download">Download</button></span></div>' +
        '<pre class="code-box"><code>' + esc((site.html || '').slice(0, 40000)) + '</code></pre></div>';
    } else {
      body = renderSettings(site, domain);
    }

    return '<button class="link-btn" data-action="nav" data-view="dashboard" style="margin-bottom:14px">' + ic('arrowLeft', 12) + ' All websites</button>' +
      '<div class="page-head"><div><div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">' +
        '<h1>' + esc(site.businessName) + '</h1><span class="badge ' + tone + '"><span class="dot"></span>' + (site.status === 'live' ? 'Live' : site.status === 'building' ? 'Building ' + site.progress + '%' : 'Error') + '</span>' +
        (domain && domain.status === 'live' ? '<span class="badge accent">' + esc(domain.domain) + '</span>' : '') + '</div>' +
        '<p class="mono" style="margin-top:6px">' + esc(site.domain || site.slug + '.orbit.local') + ' · preview ' + esc(site.slug) + '.orbit.local · ' + esc(site.industry) + ' · ' + esc(site.theme) + ' · ' + (site.sizeKb || '—') + ' KB</p></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn ghost" data-action="open-live" data-slug="' + attr(site.slug) + '"' + (site.status !== 'live' ? ' disabled' : '') + '>' + ic('external', 14) + ' Open live site</button>' +
          '<button class="btn primary" data-action="tab" data-tab="domain">' + ic('globe', 14) + (domain ? ' Domain & DNS' : ' Connect domain') + '</button></div></div>' +
      '<div class="tabs">' + tabs.map(function (t) {
        return '<button class="' + (ui.tab === t[0] ? 'on' : '') + '" data-action="tab" data-tab="' + t[0] + '">' + ic(t[2], 13) + t[1] + '</button>';
      }).join('') + '</div>' + body;
  }

  function renderDomainPanel(site, domain) {
    if (!domain) {
      return '<div class="card pad">' +
        '<div class="kicker">' + ic('globe', 12) + ' Custom domain</div>' +
        '<h2 style="font-size:17px;margin-top:6px">Point your own domain here</h2>' +
        '<p style="font-size:13px;color:var(--dim);margin-top:5px;max-width:600px;line-height:1.6">Enter a domain you own. Orbit creates the DNS records you need, then walks the mapping through verification and SSL — you can watch each step below.</p>' +
        '<div class="search-row"><div class="field-wrap"><input id="f-domain" placeholder="mybusiness.com" autocomplete="off" /></div>' +
          '<button class="btn primary" data-action="map-domain">' + ic('link', 14) + ' Connect domain</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px">' +
          [['globe', 'A record', 'Points the apex to the Orbit edge IP.'], ['link', 'CNAME', 'Sends www traffic to your subdomain.'], ['lock', 'TXT', 'Proves you control the domain.']].map(function (c) {
            return '<div style="border:1px solid var(--line);border-radius:11px;background:rgba(20,20,29,.5);padding:12px">' +
              '<span style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:rgba(99,102,241,.12);color:#a5b4fc">' + ic(c[0], 13) + '</span>' +
              '<p style="font-size:11.5px;font-weight:700;margin-top:8px">' + c[1] + '</p><p style="font-size:10.5px;color:var(--dim);line-height:1.5;margin-top:3px">' + c[2] + '</p></div>';
          }).join('') + '</div>' +
        '<p class="note" style="margin-top:16px">The free subdomain keeps working: <b class="mono">' + esc(site.slug) + '.orbit.local</b></p>' +
      '</div>';
    }

    var idx = domain.status === 'live' ? 3 : domain.status === 'ssl_provisioning' ? 2 : domain.status === 'verified' || domain.status === 'verifying' ? 1 : 0;
    var steps = [
      ['Domain added', 'Orbit records the hostname against this site.'],
      ['DNS verified', 'A, CNAME and TXT records resolve to our edge.'],
      ['SSL issued', 'Certificate provisioned for apex and www.'],
      ['Serving traffic', 'Requests to this host now return the site.']
    ];
    var pipe = steps.map(function (s, i) {
      var done = i < idx || (i === 3 && domain.status === 'live');
      var active = i === idx && domain.status !== 'live';
      return '<div class="pipe-step ' + (done ? 'done' : active ? 'active' : '') + '">' +
        '<div class="head"><i>' + (done ? ic('check', 9) : active ? '<span class="spinner"></span>' : i + 1) + '</i>' + s[0] + '</div>' +
        '<p>' + s[1] + '</p></div>';
    }).join('');

    var rows = domain.records.map(function (r) {
      var tone = r.status === 'verified' ? 'live' : r.status === 'checking' ? 'building' : '';
      return '<tr><td><span class="type-tag">' + r.type + '</span></td>' +
        '<td class="mono">' + esc(r.name) + '</td>' +
        '<td><span class="val mono">' + esc(r.value) + '</span></td>' +
        '<td style="color:var(--dim)">' + r.ttl + '</td>' +
        '<td><span class="badge ' + tone + '">' + (r.status === 'checking' ? '<span class="spinner"></span>' : '') + r.status + '</span></td>' +
        '<td style="text-align:right"><button class="copy" data-action="copy" data-value="' + attr(r.value) + '">Copy</button></td></tr>';
    }).join('');

    var sslTone = domain.ssl.status === 'active' ? 'live' : domain.ssl.status === 'issuing' ? 'building' : '';

    return '<div class="card pad">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">' +
        '<div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h2 style="font-size:17px">' + esc(domain.domain) + '</h2>' +
          '<span class="badge ' + (domain.status === 'live' ? 'live' : 'building') + '">' + (domain.status === 'live' ? 'Live' : esc(domain.status.replace(/_/g, ' '))) + '</span></div>' +
          '<p class="mono" style="font-size:10.5px;color:var(--dim);margin-top:5px">' + esc(domain.domain) + ' → ' + esc(domain.target) + '</p></div>' +
        '<div style="display:flex;gap:8px"><button class="btn ghost sm" data-action="recheck">' + ic('refresh', 13) + ' Recheck</button>' +
        '<button class="btn danger sm" data-action="remove-domain">' + ic('trash', 13) + ' Remove</button></div>' +
      '</div>' +
      '<div class="pipeline">' + pipe + '</div></div>' +
    '<div class="card" style="margin-top:16px;overflow:hidden">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;padding:13px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap"><b style="font-size:12.5px">DNS records</b><span style="font-size:10.5px;color:var(--dim)">Add these at your registrar · TTL in seconds</span></div>' +
      '<div style="overflow-x:auto"><table class="records"><thead><tr><th>Type</th><th>Name</th><th>Value</th><th>TTL</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div style="padding:11px 16px;border-top:1px solid var(--line);font-size:10.5px;color:var(--dim)">Verification TXT record proves ownership before any certificate is issued. Propagation can take up to 24 hours at a registrar; here it is simulated in a few seconds.</div></div>' +
    '<div class="split-2" style="margin-top:16px">' +
      '<div class="card pad"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:12.5px">SSL certificate</b><span class="badge ' + sslTone + '">' + domain.ssl.status + '</span></div>' +
        '<dl class="kv" style="margin-top:12px">' +
          '<div><dt>Issuer</dt><dd>' + esc(domain.ssl.issuer) + '</dd></div>' +
          '<div><dt>Covers</dt><dd class="mono">' + esc(domain.domain) + ', www.' + esc(domain.domain) + '</dd></div>' +
          '<div><dt>Expires</dt><dd>' + (domain.ssl.expiresAt ? new Date(domain.ssl.expiresAt).toLocaleDateString('en-IN') : '—') + '</dd></div>' +
          '<div><dt>Last checked</dt><dd>' + (domain.checkedAt ? new Date(domain.checkedAt).toLocaleTimeString('en-IN') : '—') + '</dd></div>' +
        '</dl></div>' +
      '<div class="card pad"><b style="font-size:12.5px">Traffic routing</b>' +
        '<p style="font-size:11.5px;color:var(--dim);line-height:1.6;margin-top:8px">The host is matched against the domain registry. Once live, a request for <span class="mono">' + esc(domain.domain) + '</span> is answered with this site’s HTML — no redirect to a third-party host.</p>' +
        '<div style="margin-top:12px;border:1px solid var(--line);border-radius:10px;background:rgba(20,20,29,.5);padding:11px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;display:grid;gap:7px;color:var(--dim)">' +
          '<span>' + ic('arrowRight', 11) + ' GET https://' + esc(domain.domain) + '/</span>' +
          '<span>' + ic('arrowRight', 11) + ' host match → ' + esc(domain.target) + '</span>' +
          '<span style="color:#6ee7b7">' + ic('check', 11) + ' 200 · site HTML</span></div>' +
        (domain.status === 'live' ? '<button class="btn ghost sm wide" style="margin-top:12px" data-action="open-domain" data-domain="' + attr(domain.domain) + '">' + ic('external', 13) + ' Open ' + esc(domain.domain) + '</button>' : '') +
      '</div></div>';
  }

  function renderSettings(site, domain) {
    var industries = Object.keys(GEN.INDUSTRIES).map(function (k) { return '<option value="' + k + '"' + (site.industry === k ? ' selected' : '') + '>' + esc(GEN.INDUSTRIES[k].label) + '</option>'; }).join('');
    var themes = Object.keys(GEN.THEMES).map(function (k) { return '<option value="' + k + '"' + (site.theme === k ? ' selected' : '') + '>' + esc(GEN.THEMES[k].label) + '</option>'; }).join('');

    return '<div class="split-2" style="align-items:start">' +
      '<div class="card pad"><b style="font-size:12.5px">Site details</b>' +
        '<div class="field" style="margin-top:14px"><label class="label">Business name</label><input class="input" id="s-name" value="' + attr(site.businessName) + '" /></div>' +
        '<div class="form-row two">' +
          '<div class="field"><label class="label">Industry</label><select class="input" id="s-industry">' + industries + '</select></div>' +
          '<div class="field"><label class="label">Theme</label><select class="input" id="s-theme">' + themes + '</select></div></div>' +
        '<div class="field"><label class="label">Description</label><textarea class="input" id="s-desc">' + esc(site.description || '') + '</textarea></div>' +
        '<div class="form-row two">' +
          '<div class="field"><label class="label">City</label><input class="input" id="s-city" value="' + attr(site.city || '') + '" /></div>' +
          '<div class="field"><label class="label">Phone</label><input class="input" id="s-phone" value="' + attr(site.phone || '') + '" /></div></div>' +
        '<div class="divider"></div><div style="display:flex;justify-content:flex-end"><button class="btn primary" data-action="save-settings">' + ic('refresh', 14) + ' Save & rebuild</button></div></div>' +
      '<div style="display:grid;gap:16px">' +
        '<div class="card pad"><b style="font-size:12.5px">Hosting</b><dl class="kv" style="margin-top:12px">' +
          '<div><dt>Subdomain</dt><dd class="mono">' + esc(site.slug) + '.orbit.local</dd></div>' +
          '<div><dt>Custom domain</dt><dd>' + (domain ? esc(domain.domain) : 'not mapped') + '</dd></div>' +
          '<div><dt>Created</dt><dd>' + new Date(site.createdAt).toLocaleDateString('en-IN') + '</dd></div>' +
          '<div><dt>Last publish</dt><dd>' + (site.publishedAt ? new Date(site.publishedAt).toLocaleString('en-IN') : '—') + '</dd></div>' +
        '</dl></div>' +
        '<div class="card pad" style="border-color:rgba(251,113,133,.2)"><b style="font-size:12.5px;color:#fecdd3">Danger zone</b>' +
          '<p style="font-size:11.5px;color:var(--dim);line-height:1.6;margin-top:6px">Deleting removes the generated site, the subdomain and any domain mapping. This cannot be undone.</p>' +
          '<button class="btn danger wide" style="margin-top:12px" data-action="delete">' + ic('trash', 13) + ' Delete this site</button></div>' +
      '</div></div>';
  }

  /* ------------------------------------------------------------------ actions */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');

    if (action === 'nav') {
      var view = el.getAttribute('data-view');
      if (view === 'dashboard') go('#/');
      if (view === 'new') { ui.step = 'details'; ui.check = null; ui.slug = null; ui.mode = 'domain'; go('#/new'); }
      return;
    }
    if (action === 'manage') { ui.tab = 'preview'; ui.device = 'desktop'; go('#/site/' + el.getAttribute('data-slug')); return; }
    if (action === 'open-live') {
      var liveSlug = el.getAttribute('data-slug');
      var liveSite = findSite(liveSlug);
      var liveDom = findDomain(liveSlug);
      if (liveSite && liveSite.domain && liveDom && liveDom.status === 'live') {
        ui.liveDomain = liveSite.domain;
        go('#/d/' + encodeURIComponent(liveSite.domain));
      } else {
        go('#/s/' + liveSlug);
      }
      return;
    }
    if (action === 'mode') { syncForm(); ui.mode = el.getAttribute('data-mode'); paint(); return; }
    if (action === 'open-domain') { ui.liveDomain = el.getAttribute('data-domain'); go('#/d/' + encodeURIComponent(ui.liveDomain)); return; }
    if (action === 'back') { go('#/'); return; }
    if (action === 'tab') { ui.tab = el.getAttribute('data-tab'); paint(); return; }
    if (action === 'device') { ui.device = el.getAttribute('data-device'); paint(); return; }
    if (action === 'repaint') { paint(); return; }
    if (action === 'refresh') { paint(); toast('List refreshed'); return; }
    if (action === 'new-again') { ui.step = 'details'; ui.slug = null; ui.check = null; ui.form.slug = ''; ui.form.domain = ''; ui.mode = 'domain'; ui.slugTouched = false; go('#/new'); return; }

    if (action === 'industry') { ui.form.industry = el.getAttribute('data-id'); paint(); return; }
    if (action === 'theme') { ui.form.theme = el.getAttribute('data-id'); paint(); return; }

    if (action === 'to-address') {
      syncForm();
      if (ui.form.businessName.trim().length < 2) { toast('Add a business name first', 'err'); return; }
      if (!ui.slugTouched || !ui.form.slug) ui.form.slug = slugify(ui.form.businessName);
      ui.check = checkSlug(ui.form.slug);
      ui.step = 'address';
      paint();
      return;
    }
    if (action === 'to-details') { syncForm(); ui.step = 'details'; paint(); return; }

    if (action === 'build') {
      syncForm();
      var isDom = ui.mode === 'domain';
      var domainVal = cleanDomain(ui.form.domain);

      if (isDom) {
        if (!validDomain(domainVal)) { toast('Enter a valid domain, e.g. mybusiness.com', 'err'); return; }
        if (db.domains.filter(function (d) { return d.domain === domainVal; }).length) {
          toast('That domain is already connected to another site', 'err');
          return;
        }
      } else {
        var res = checkSlug(ui.form.slug);
        if (!res.available) { toast(res.reason, 'err'); return; }
      }

      // internal slug always comes from the business name; the domain is the public address
      var baseSlug = slugify(ui.form.businessName) || slugify(domainVal);
      var siteSlug = baseSlug;
      var n = 2;
      while (findSite(siteSlug)) { siteSlug = baseSlug + '-' + n; n += 1; }

      var site = {
        id: uid('site'),
        slug: siteSlug,
        domain: isDom ? domainVal : null,
        businessName: ui.form.businessName.trim(),
        industry: ui.form.industry,
        theme: ui.form.theme,
        description: ui.form.description.trim(),
        city: ui.form.city.trim() || 'Bengaluru, India',
        phone: ui.form.phone.trim() || '+91 80 4000 1234',
        status: 'building',
        phase: 'analyze',
        phaseLabel: PHASES[0].label,
        progress: 4,
        views: 0,
        createdAt: now(),
        updatedAt: now()
      };
      db.sites.push(site);
      save();
      if (isDom) attachDomain(site, domainVal);
      ui.slug = site.slug;
      ui.step = 'build';
      paint();
      startBuild(site.slug);
      return;
    }

    if (action === 'dash-domain-start') {
      var dInput = document.getElementById('dash-domain');
      var wanted = cleanDomain(dInput ? dInput.value : ui.dashDomain);
      if (!validDomain(wanted)) { toast('Enter a valid domain, e.g. mybusiness.com', 'err'); return; }
      ui.dashDomain = wanted;
      ui.form.domain = wanted;
      ui.mode = 'domain';
      ui.step = 'details';
      go('#/new');
      return;
    }

    if (action === 'map-domain') {
      var input2 = document.getElementById('f-domain');
      var domain = cleanDomain(input2 ? input2.value : '');
      if (!validDomain(domain)) { toast('Enter a valid domain, e.g. mybusiness.com', 'err'); return; }
      var clash = db.domains.filter(function (d) { return d.domain === domain && d.siteSlug !== ui.slug; })[0];
      if (clash) { toast('Already mapped to ' + clash.siteSlug, 'err'); return; }
      var hostSite = findSite(ui.slug);
      if (!hostSite) return;
      attachDomain(hostSite, domain);
      paint();
      toast(domain + ' connected — running DNS and SSL checks');
      return;
    }

    if (action === 'recheck') {
      var d = findDomain(ui.slug);
      if (!d) return;
      d.status = 'pending';
      d.records.forEach(function (r) { r.status = 'pending'; });
      d.ssl = { status: 'pending', issuer: "Let's Encrypt (simulated)", expiresAt: null };
      d.checkedAt = now();
      save();
      paint();
      startDomainChecks(d.id);
      toast('Re-running DNS checks');
      return;
    }

    if (action === 'remove-domain') {
      if (!confirm('Remove the custom domain from this site?')) return;
      db.domains = db.domains.filter(function (d) { return d.siteSlug !== ui.slug; });
      save();
      paint();
      toast('Domain mapping removed');
      return;
    }

    if (action === 'save-settings') {
      var s = findSite(ui.slug);
      if (!s) return;
      s.businessName = document.getElementById('s-name').value.trim() || s.businessName;
      s.industry = document.getElementById('s-industry').value;
      s.theme = document.getElementById('s-theme').value;
      s.description = document.getElementById('s-desc').value.trim();
      s.city = document.getElementById('s-city').value.trim();
      s.phone = document.getElementById('s-phone').value.trim();
      s.updatedAt = now();
      save();
      startBuild(s.slug);
      toast('Rebuilding with the new details');
      return;
    }

    if (action === 'delete') {
      var site2 = findSite(ui.slug);
      if (!site2) return;
      if (!confirm('Delete ' + site2.businessName + '? This cannot be undone.')) return;
      db.sites = db.sites.filter(function (x) { return x.slug !== ui.slug; });
      db.domains = db.domains.filter(function (d) { return d.siteSlug !== ui.slug; });
      save();
      go('#/');
      toast('Site deleted');
      return;
    }

    if (action === 'copy') {
      var val = el.getAttribute('data-value');
      var site3 = findSite(ui.slug);
      if (val === 'html' && site3) val = site3.html;
      copyText(val || '');
      return;
    }

    if (action === 'download') {
      var site4 = findSite(ui.slug);
      if (!site4) return;
      var blob = new Blob([site4.html], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = site4.slug + '.html';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast('Downloaded ' + site4.slug + '.html');
      return;
    }
  });

  function copyText(text) {
    var done = function () { toast('Copied to clipboard'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { toast('Copy blocked by the browser', 'err'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy blocked by the browser', 'err'); }
      ta.remove();
    }
  }

  function syncForm() {
    var name = document.getElementById('f-name');
    var desc = document.getElementById('f-desc');
    var city = document.getElementById('f-city');
    var phone = document.getElementById('f-phone');
    var slugEl = document.getElementById('f-slug');
    var domainEl = document.getElementById('f-site-domain');
    if (name) {
      ui.form.businessName = name.value;
      if (!ui.slugTouched) ui.form.slug = slugify(name.value);
    }
    if (desc) ui.form.description = desc.value;
    if (city) ui.form.city = city.value;
    if (phone) ui.form.phone = phone.value;
    if (slugEl) {
      ui.form.slug = slugify(slugEl.value);
      ui.slugTouched = true;
      ui.check = checkSlug(ui.form.slug);
    }
    if (domainEl) ui.form.domain = cleanDomain(domainEl.value);
  }

  /* live inputs */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'dash-domain') {
      ui.dashDomain = cleanDomain(t.value);
      var note = t.closest('.search-card').querySelector('.note');
      if (note) {
        note.style.color = ui.dashDomain && !validDomain(ui.dashDomain) ? '#fda4af' : '';
        note.innerHTML = ui.dashDomain && !validDomain(ui.dashDomain)
          ? 'That does not look like a domain — try mybusiness.com'
          : 'We create the A, CNAME and TXT records, run the SSL checks and track the status until it resolves. No domain yet? Pick a free Orbit address inside the builder.';
      }
      return;
    }
    if (t.id === 'f-site-domain') {
      ui.form.domain = cleanDomain(t.value);
      var dhint = t.closest('.field').querySelector('div[style*="min-height"]');
      var ok = validDomain(ui.form.domain);
      if (dhint) {
        dhint.innerHTML = !ui.form.domain
          ? '<span style="color:var(--dim)">The domain you already own — apex or subdomain, both work.</span>'
          : ok
            ? '<span class="hint-line ok" style="margin:0">' + ic('check', 13) + esc(cleanDomain(ui.form.domain)) + ' will be the live address</span>'
            : '<span class="hint-line bad" style="margin:0">' + ic('alert', 13) + 'That does not look like a domain — try mybusiness.com</span>';
      }
      var genBtn = document.querySelector('[data-action="build"]');
      if (genBtn) genBtn.disabled = !ok;
      return;
    }
    if (t.id === 'f-name') {
      ui.form.businessName = t.value;
      if (!ui.slugTouched) ui.form.slug = slugify(t.value);
      return;
    }
    if (t.id === 'f-slug') {
      ui.form.slug = slugify(t.value);
      ui.slugTouched = true;
      ui.check = checkSlug(ui.form.slug);
      var line = t.closest('.field').querySelector('div[style*="min-height"]');
      if (line) {
        line.innerHTML = ui.check.available
          ? '<span class="hint-line ok" style="margin:0">' + ic('check', 13) + 'Available — it is yours.</span>'
          : '<span class="hint-line bad" style="margin:0">' + ic('alert', 13) + esc(ui.check.reason) + '</span>';
      }
      var buildBtn = document.querySelector('[data-action="build"]');
      if (buildBtn) buildBtn.disabled = !ui.check.available;
      return;
    }
    if (t.id === 'f-desc') { ui.form.description = t.value; return; }
    if (t.id === 'f-city') { ui.form.city = t.value; return; }
    if (t.id === 'f-phone') { ui.form.phone = t.value; }
  });

  /* count visits when a live site is opened */
  window.addEventListener('hashchange', function () {
    var r = parseHash();
    if (r.view === 'live' && r.slug) {
      var s = findSite(r.slug);
      if (s) { s.views = (s.views || 0) + 1; save(); }
    }
    if (r.view === 'liveDomain') {
      var d = db.domains.filter(function (x) { return x.domain === r.domain; })[0];
      var s2 = d ? findSite(d.siteSlug) : null;
      if (s2) { s2.views = (s2.views || 0) + 1; save(); }
    }
    route();
  });

  /* finish anything left mid-build from a previous session */
  db.sites.forEach(function (s) {
    if (s.status === 'building') {
      s.status = 'live';
      s.progress = 100;
      s.phase = 'done';
      s.phaseLabel = 'Published';
      s.html = GEN.buildSite({
        businessName: s.businessName, industry: s.industry, theme: s.theme,
        description: s.description, city: s.city, phone: s.phone, slug: s.slug,
        domain: (findDomain(s.slug) || {}).domain
      });
      s.sizeKb = Math.round(new Blob([s.html]).size / 1024);
      save();
    }
  });

  if (!location.hash) location.hash = '#/';
  route();
})();
