const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

const get = (url) => fetch(url).then(handle);
const send = (url, method, body) =>
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(handle);

export const api = {
  meta: () => get('/api/meta'),
  stats: () => get('/api/stats'),
  health: () => get('/api/health'),

  sites: () => get('/api/sites').then((d) => d.sites),
  site: (slug, withHtml = false) => get(`/api/sites/${slug}${withHtml ? '?html=1' : ''}`).then((d) => d.site),
  status: (slug) => get(`/api/sites/${slug}/status`),
  createSite: (payload) => send('/api/sites', 'POST', payload).then((d) => d.site),
  updateSite: (slug, payload) => send(`/api/sites/${slug}`, 'PUT', payload).then((d) => d.site),
  deleteSite: (slug) => send(`/api/sites/${slug}`, 'DELETE'),

  checkSlug: (slug) => get(`/api/subdomains/check?slug=${encodeURIComponent(slug)}`),

  domains: () => get('/api/domains').then((d) => d.domains),
  domain: (slug) => get(`/api/sites/${slug}/domain`).then((d) => d.domain),
  mapDomain: (slug, domain) => send(`/api/sites/${slug}/domain`, 'POST', { domain }).then((d) => d.domain),
  recheckDomain: (slug) => send(`/api/sites/${slug}/domain/recheck`, 'POST').then((d) => d.domain),
  removeDomain: (slug) => send(`/api/sites/${slug}/domain`, 'DELETE')
};

export const liveUrl = (slug) => `/sites/${slug}`;
