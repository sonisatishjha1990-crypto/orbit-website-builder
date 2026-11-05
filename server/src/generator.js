'use strict';

/**
 * Local "AI" website generator.
 * Deterministic template engine: intake form -> industry copy + theme tokens -> full HTML document.
 * No external API is contacted at any point.
 */

const ICONS = {
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  leaf: '<path d="M20 4c0 8-4.6 13-11 13H5c0-8 4.6-13 11-13h4z"/><path d="M5 20c2-5 5-8 10-10"/>',
  heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.6-7 9-7 9z"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.7l5.9-.8L12 3.5z"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
  chart: '<path d="M4 20V6M10 20V10M16 20V4M22 20H2"/>',
  cake: '<path d="M4 20h16v-6a3 3 0 00-3-3H7a3 3 0 00-3 3v6z"/><path d="M12 8V5M8 11V9M16 11V9"/>',
  dumbbell: '<path d="M4 9v6M8 7v10M16 7v10M20 9v6M8 12h8"/>',
  scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 8l12 12M20 4L8 16"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9z"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/>',
  stethoscope: '<path d="M6 3v6a4 4 0 008 0V3"/><path d="M10 17a4 4 0 004-4v-1"/><circle cx="17" cy="10" r="2.5"/>',
  cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M3 4h2l2.4 11h11L21 8H6"/>',
  book: '<path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5z"/><path d="M8 7h6M8 11h6"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  phone: '<path d="M6 3h3l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v3a2 2 0 01-2.2 2A16 16 0 014 5.2 2 2 0 016 3z"/>',
  pin: '<path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>'
};

function icon(name, cls = 'ico') {
  const body = ICONS[name] || ICONS.spark;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

const THEMES = {
  aurora: { label: 'Aurora', accent: '#6366f1', accent2: '#22d3ee', glow: '99,102,241' },
  emerald: { label: 'Emerald', accent: '#0f9f6e', accent2: '#34d399', glow: '16,185,129' },
  sunset: { label: 'Sunset', accent: '#ea580c', accent2: '#f43f5e', glow: '249,115,22' },
  midnight: { label: 'Midnight', accent: '#7c3aed', accent2: '#3b82f6', glow: '124,58,237' },
  mono: { label: 'Mono', accent: '#334155', accent2: '#64748b', glow: '71,85,105' }
};

const INDUSTRIES = {
  bakery: {
    label: 'Bakery & Café',
    badge: 'Baked fresh daily',
    headline: 'Freshly baked, before the sun comes up',
    sub: 'Small-batch sourdough, laminated pastries and celebration cakes made by hand every morning.',
    services: [
      { icon: 'cake', title: 'Artisan breads', text: 'Naturally leavened loaves with a 24-hour ferment and a properly crackling crust.' },
      { icon: 'heart', title: 'Custom cakes', text: 'Birthdays, weddings and everything in between, designed with you in a 10-minute call.' },
      { icon: 'clock', title: 'Morning delivery', text: 'Order before 9 pm and we knock on your door with warm boxes by 7 am.' }
    ],
    stats: [{ value: '12 yrs', label: 'of daily baking' }, { value: '38', label: 'recipes on rotation' }, { value: '4.9', label: 'average rating' }],
    about: 'We are a neighbourhood bakery that still mixes by hand. Everything is made in small batches, sold the day it is baked, and nothing sits overnight.',
    checklist: ['No preservatives, no shortcuts', 'Locally milled flour', 'Same-day baking, always'],
    testimonial: { quote: 'The cardamom buns sell out by 10 am for a reason. I have been coming every Saturday for three years.', name: 'Ananya R.', role: 'Regular since 2021' },
    cta: 'Order your morning box',
    sectionKicker: 'What we bake',
    sectionTitle: 'Made by hand, sold the day it is baked'
  },
  restaurant: {
    label: 'Restaurant & Food',
    badge: 'Now taking reservations',
    headline: 'A menu built around the season, not the freezer',
    sub: 'Regional produce, open flame and a short menu that changes every few weeks.',
    services: [
      { icon: 'leaf', title: 'Seasonal menu', text: 'A compact menu rewritten around what the market has that week.' },
      { icon: 'star', title: 'Private dining', text: 'A 24-seat room for celebrations, tasting menus and long lunches.' },
      { icon: 'clock', title: 'Easy reservations', text: 'Book a table in under a minute, with instant confirmation.' }
    ],
    stats: [{ value: '4.8', label: 'guest rating' }, { value: '60', label: 'seats, all day' }, { value: '9', label: 'years open' }],
    about: 'A small kitchen with a big fire. We cook what is good that week, keep the menu short, and let the produce do most of the talking.',
    checklist: ['Produce sourced weekly', 'Vegetarian and vegan options', 'Open kitchen, no secrets'],
    testimonial: { quote: 'We came for dinner and stayed three hours. The kind of place you plan your week around.', name: 'Rahul M.', role: 'Guest' },
    cta: 'Reserve a table',
    sectionKicker: 'At the table',
    sectionTitle: 'A short menu, cooked properly'
  },
  salon: {
    label: 'Salon & Spa',
    badge: 'Appointments open',
    headline: 'Good hair days, on a schedule you control',
    sub: 'Precision cuts, colour and skin treatments by a team that asks before it starts.',
    services: [
      { icon: 'scissors', title: 'Cut & finish', text: 'A consultation first, then a cut built around your hair, not a trend.' },
      { icon: 'spark', title: 'Colour studio', text: 'Balayage, gloss and grey coverage with low-ammonia products.' },
      { icon: 'heart', title: 'Skin & spa', text: 'Facials, threading and a 45-minute reset for when the week has been long.' }
    ],
    stats: [{ value: '8', label: 'stylists on the floor' }, { value: '45 min', label: 'average visit' }, { value: '4.9', label: 'client rating' }],
    about: 'A calm studio with no upselling. You get a consultation, an honest recommendation and a finish you can recreate at home.',
    checklist: ['Consultation on every visit', 'Sanitised tools, every chair', 'Products you can buy later, never pushed'],
    testimonial: { quote: 'First salon that actually listened when I said not too short. I have not been anywhere else since.', name: 'Sneha K.', role: 'Client' },
    cta: 'Book an appointment',
    sectionKicker: 'Services',
    sectionTitle: 'Cut, colour and care, done with intent'
  },
  fitness: {
    label: 'Fitness & Wellness',
    badge: 'First week free',
    headline: 'Strength that fits into a real week',
    sub: 'Coached small-group sessions, 45 minutes each, with a plan that adjusts as you do.',
    services: [
      { icon: 'dumbbell', title: 'Strength coaching', text: 'Small groups of six or fewer, with a coach correcting every rep.' },
      { icon: 'bolt', title: 'Conditioning', text: 'Short, hard, structured sessions for the days you have 30 minutes.' },
      { icon: 'chart', title: 'Progress tracking', text: 'Every lift logged, every month reviewed with your coach.' }
    ],
    stats: [{ value: '6', label: 'people per session' }, { value: '45 min', label: 'per class' }, { value: '1200+', label: 'members coached' }],
    about: 'No mirrors-and-music theatre. We coach the basics properly, progress you slowly, and keep the room small enough that nobody is invisible.',
    checklist: ['Coach on the floor, every session', 'Beginner-friendly onboarding', 'Pause or cancel any month'],
    testimonial: { quote: 'I had never touched a barbell. Six months in I am deadlifting my bodyweight and my back stopped hurting.', name: 'Vikram S.', role: 'Member, 8 months' },
    cta: 'Claim your free week',
    sectionKicker: 'How we train',
    sectionTitle: 'Coached sessions, honest progress'
  },
  tech: {
    label: 'Technology & SaaS',
    badge: 'Trusted by 400+ teams',
    headline: 'Ship faster without breaking what works',
    sub: 'One workspace for planning, delivery and reporting, so your team stops context-switching.',
    services: [
      { icon: 'code', title: 'Developer-first', text: 'A typed API, webhooks and an SDK that does not fight your stack.' },
      { icon: 'bolt', title: 'Fast by default', text: 'Sub-100 ms queries at the edge, with no cache warm-up to babysit.' },
      { icon: 'shield', title: 'Secure and auditable', text: 'SSO, granular roles and an audit log you can hand to procurement.' }
    ],
    stats: [{ value: '99.98%', label: 'uptime, 12 months' }, { value: '400+', label: 'teams onboard' }, { value: '<100ms', label: 'p95 response' }],
    about: 'We build the boring infrastructure that makes product teams fast. Small surface area, predictable behaviour, and documentation that is actually current.',
    checklist: ['SOC 2 aligned controls', 'Migration help included', 'No per-seat surprise pricing'],
    testimonial: { quote: 'We replaced three tools with this and cut our release cycle from two weeks to two days.', name: 'Priya N.', role: 'VP Engineering' },
    cta: 'Start free, no card',
    sectionKicker: 'Platform',
    sectionTitle: 'Everything the team needs, in one place'
  },
  clinic: {
    label: 'Clinic & Healthcare',
    badge: 'Same-week appointments',
    headline: 'Care that takes the time to explain',
    sub: 'Consultations of 30 minutes, clear treatment plans and follow-ups that actually happen.',
    services: [
      { icon: 'stethoscope', title: 'General medicine', text: 'Routine checks, chronic care and second opinions, unhurried.' },
      { icon: 'heart', title: 'Preventive care', text: 'Annual health panels with a plain-language read of the results.' },
      { icon: 'shield', title: 'Records you own', text: 'Every prescription and report available to download, always.' }
    ],
    stats: [{ value: '30 min', label: 'per consultation' }, { value: '15k+', label: 'patients seen' }, { value: '4.9', label: 'patient rating' }],
    about: 'A calm clinic with appointments that start on time. We explain the diagnosis before the prescription and never rush the last five minutes.',
    checklist: ['Appointments run on schedule', 'Reports shared digitally', 'Follow-up call after every procedure'],
    testimonial: { quote: 'The first doctor who drew the diagnosis on paper until I understood it. My whole family comes here now.', name: 'Meera J.', role: 'Patient' },
    cta: 'Book a consultation',
    sectionKicker: 'Care',
    sectionTitle: 'Straight answers, unhurried appointments'
  },
  realestate: {
    label: 'Real Estate',
    badge: '12 listings live',
    headline: 'Property decisions, without the pressure',
    sub: 'Verified listings, honest pricing context and a walk-through before you commit to anything.',
    services: [
      { icon: 'home', title: 'Verified listings', text: 'Every property inspected and documented before it goes live.' },
      { icon: 'chart', title: 'Pricing context', text: 'Comparable sales and rental yields for the exact street, not the city.' },
      { icon: 'shield', title: 'Paperwork handled', text: 'Agreement drafting, registration and handover, coordinated for you.' }
    ],
    stats: [{ value: '340+', label: 'homes closed' }, { value: '12', label: 'live listings' }, { value: '4.8', label: 'client rating' }],
    about: 'We work a small number of neighbourhoods properly instead of a large map badly. You get local comparables, not a sales pitch.',
    checklist: ['Site visits within 48 hours', 'No listing without an inspection', 'Fees disclosed upfront'],
    testimonial: { quote: 'They talked us out of one flat and into a better one. That is not something an agent usually does.', name: 'Arjun & Divya', role: 'Buyers' },
    cta: 'Book a site visit',
    sectionKicker: 'How we work',
    sectionTitle: 'Local knowledge, no pressure'
  },
  ecommerce: {
    label: 'Retail & E-commerce',
    badge: 'Free shipping over ₹999',
    headline: 'Everyday goods, made to last longer',
    sub: 'A small catalogue of well-made things, backed by a no-questions 30-day return.',
    services: [
      { icon: 'cart', title: 'Fast dispatch', text: 'Orders placed before 4 pm leave the warehouse the same day.' },
      { icon: 'shield', title: '30-day returns', text: 'Change your mind, send it back, no forms to argue with.' },
      { icon: 'star', title: 'Tested first', text: 'Nothing is listed until the team has used it for a month.' }
    ],
    stats: [{ value: '24h', label: 'average dispatch' }, { value: '18k', label: 'orders shipped' }, { value: '4.8', label: 'review average' }],
    about: 'We keep the catalogue deliberately small. If a product does not survive a month of daily use, it does not get listed.',
    checklist: ['Same-day dispatch', 'Free returns for 30 days', 'Real reviews, unedited'],
    testimonial: { quote: 'Third order this year. Packaging is sensible, delivery is quick, and the products last.', name: 'Karthik B.', role: 'Customer' },
    cta: 'Shop the collection',
    sectionKicker: 'Why shop here',
    sectionTitle: 'Fewer products, chosen better'
  },
  education: {
    label: 'Education & Coaching',
    badge: 'Next cohort starts soon',
    headline: 'Learn it properly, with someone checking your work',
    sub: 'Small cohorts, live sessions and feedback on every assignment, not just a video library.',
    services: [
      { icon: 'book', title: 'Live classes', text: 'Twice-weekly sessions with recordings if you have to miss one.' },
      { icon: 'check', title: 'Feedback loops', text: 'Every assignment reviewed within 48 hours by the instructor.' },
      { icon: 'chart', title: 'Career support', text: 'Portfolio reviews, mock interviews and introductions where they fit.' }
    ],
    stats: [{ value: '18', label: 'per cohort' }, { value: '92%', label: 'completion rate' }, { value: '4.9', label: 'learner rating' }],
    about: 'Teaching is the whole product. We cap the cohort, keep the sessions live and mark the work ourselves, because that is where learning happens.',
    checklist: ['Cohorts capped at 18', 'Assignments marked by instructors', 'Lifetime access to recordings'],
    testimonial: { quote: 'The feedback on my third assignment was more useful than a year of tutorials.', name: 'Farah A.', role: 'Alumna, 2024' },
    cta: 'Apply for the next cohort',
    sectionKicker: 'Programme',
    sectionTitle: 'Live teaching, marked work, small groups'
  },
  other: {
    label: 'Business & Services',
    badge: 'Now booking projects',
    headline: 'Work that gets finished, on the date agreed',
    sub: 'A small team, a clear scope and weekly updates you do not have to chase.',
    services: [
      { icon: 'spark', title: 'Clear scope', text: 'A written scope, a fixed price and no surprise line items.' },
      { icon: 'clock', title: 'Weekly updates', text: 'A short Friday note on what moved and what is next.' },
      { icon: 'shield', title: 'Aftercare', text: 'Thirty days of support included once the work is handed over.' }
    ],
    stats: [{ value: '120+', label: 'projects delivered' }, { value: '9 yrs', label: 'in business' }, { value: '4.9', label: 'client rating' }],
    about: 'We take on a small number of projects at a time so the work gets proper attention. Fixed scope, fixed price, weekly updates.',
    checklist: ['Fixed price, written scope', 'Weekly progress notes', '30 days of aftercare'],
    testimonial: { quote: 'Delivered a week early and answered every question after handover. Rare combination.', name: 'Nikhil T.', role: 'Client' },
    cta: 'Start a project',
    sectionKicker: 'What we do',
    sectionTitle: 'Small team, finished work'
  }
};

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function initials(name) {
  const parts = String(name || 'Orbit').trim().split(/\s+/).filter(Boolean);
  return ((parts[0] || 'O')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Build a complete, self-contained HTML document for a site.
 * @param {{businessName:string, industry:string, theme:string, description?:string, slug:string, city?:string, phone?:string, domain?:string}} input
 * @returns {string} html
 */
function buildSite(input) {
  const data = INDUSTRIES[input.industry] || INDUSTRIES.other;
  const theme = THEMES[input.theme] || THEMES.aurora;
  const name = (input.businessName || 'Your Business').trim();
  const slug = input.slug;
  const host = input.domain || `${slug}.orbit.local`;
  const city = (input.city || 'Bengaluru, India').trim();
  const phone = (input.phone || '+91 80 4000 1234').trim();
  const email = `hello@${host}`;
  const about = (input.description || data.about).trim();
  const year = new Date().getFullYear();

  const navLinks = [
    ['#services', 'Services'],
    ['#about', 'About'],
    ['#reviews', 'Reviews'],
    ['#contact', 'Contact']
  ].map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('');

  const serviceCards = data.services.map((s, i) => `
        <article class="card reveal" style="--d:${i * 80}ms">
          <span class="card-ico">${icon(s.icon)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
        </article>`).join('');

  const stats = data.stats.map((s) => `
        <div class="stat reveal"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('');

  const checklist = data.checklist.map((c) => `
          <li>${icon('check', 'tick')}<span>${esc(c)}</span></li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(name)} — ${esc(data.label)} in ${esc(city)}</title>
<meta name="description" content="${esc(about).slice(0, 158)}" />
<meta property="og:title" content="${esc(name)}" />
<meta property="og:description" content="${esc(about).slice(0, 158)}" />
<meta property="og:type" content="website" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='${encodeURIComponent(theme.accent)}'/%3E%3Ctext x='32' y='42' font-family='Inter,Arial' font-size='28' font-weight='700' fill='white' text-anchor='middle'%3E${initials(name)}%3C/text%3E%3C/svg%3E" />
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description: about,
    telephone: phone,
    email,
    address: { '@type': 'PostalAddress', addressLocality: city },
    url: `https://${host}`
  })}</script>
<style>
  :root{
    --accent:${theme.accent};
    --accent-2:${theme.accent2};
    --glow:${theme.glow};
    --ink:#0d1220;
    --body:#4a5568;
    --muted:#718096;
    --line:#e7e9f0;
    --bg:#ffffff;
    --soft:#f7f8fc;
    --radius:18px;
    --shadow:0 1px 2px rgba(13,18,32,.04), 0 12px 32px -12px rgba(13,18,32,.16);
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    margin:0;background:var(--bg);color:var(--ink);
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
    -webkit-font-smoothing:antialiased;line-height:1.6;
  }
  h1,h2,h3{line-height:1.12;letter-spacing:-.025em;margin:0}
  p{margin:0}
  a{color:inherit;text-decoration:none}
  img,svg{display:block}
  .wrap{width:min(1140px,calc(100% - 2.5rem));margin-inline:auto}
  .ico{width:22px;height:22px}
  .tick{width:18px;height:18px;color:var(--accent);flex:none;margin-top:3px}
  .eyebrow{display:inline-flex;align-items:center;gap:.5rem;font-size:.78rem;font-weight:600;
    letter-spacing:.09em;text-transform:uppercase;color:var(--accent)}
  .btn{display:inline-flex;align-items:center;gap:.55rem;padding:.85rem 1.4rem;border-radius:999px;
    font-weight:600;font-size:.95rem;border:1px solid transparent;cursor:pointer;transition:.22s ease;
    font-family:inherit}
  .btn-primary{background:var(--accent);color:#fff;box-shadow:0 10px 24px -12px rgba(var(--glow),.9)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 30px -14px rgba(var(--glow),1)}
  .btn-ghost{background:#fff;color:var(--ink);border-color:var(--line)}
  .btn-ghost:hover{border-color:var(--accent);color:var(--accent)}

  /* nav */
  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);background:rgba(255,255,255,.82);
    border-bottom:1px solid var(--line)}
  .nav-in{display:flex;align-items:center;justify-content:space-between;height:72px;gap:1.5rem}
  .brand{display:flex;align-items:center;gap:.7rem;font-weight:700;font-size:1.02rem;letter-spacing:-.02em}
  .mark{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#fff;font-size:.82rem;
    font-weight:700;background:linear-gradient(135deg,var(--accent),var(--accent-2));letter-spacing:0}
  .nav-links{display:flex;gap:1.9rem;font-size:.93rem;color:var(--body);font-weight:500}
  .nav-links a{position:relative;padding:.3rem 0;transition:color .2s}
  .nav-links a:hover{color:var(--accent)}
  .nav-cta{display:flex;align-items:center;gap:.8rem}
  .burger{display:none;background:#fff;border:1px solid var(--line);border-radius:10px;padding:.45rem;cursor:pointer;color:var(--ink)}

  /* hero */
  .hero{position:relative;overflow:hidden;padding:clamp(3.5rem,7vw,6.5rem) 0 clamp(3rem,6vw,5rem)}
  .hero::before{content:"";position:absolute;inset:-30% -10% auto -10%;height:620px;
    background:radial-gradient(45% 55% at 25% 30%,rgba(var(--glow),.20),transparent 70%),
               radial-gradient(40% 50% at 78% 12%,rgba(var(--glow),.14),transparent 70%);
    pointer-events:none}
  .hero-grid{position:relative;display:grid;grid-template-columns:1.06fr .94fr;gap:clamp(2rem,5vw,4.5rem);align-items:center}
  .pill{display:inline-flex;align-items:center;gap:.5rem;background:#fff;border:1px solid var(--line);
    padding:.4rem .85rem;border-radius:999px;font-size:.8rem;font-weight:600;color:var(--body);box-shadow:var(--shadow)}
  .dot{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px rgba(var(--glow),.16)}
  h1{font-size:clamp(2.35rem,4.6vw,3.9rem);font-weight:800;margin:1.4rem 0 1.1rem}
  h1 .grad{background:linear-gradient(100deg,var(--accent),var(--accent-2));-webkit-background-clip:text;
    background-clip:text;color:transparent}
  .lede{font-size:clamp(1.02rem,1.4vw,1.16rem);color:var(--body);max-width:34rem}
  .hero-actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}
  .trust{display:flex;align-items:center;gap:.9rem;margin-top:2.1rem;font-size:.86rem;color:var(--muted)}
  .avatars{display:flex}
  .avatars span{width:30px;height:30px;border-radius:50%;border:2px solid #fff;margin-left:-9px;
    display:grid;place-items:center;font-size:.68rem;font-weight:700;color:#fff}
  .avatars span:first-child{margin-left:0}
  .stars{color:#f5a524;letter-spacing:.12em;font-size:.85rem}

  /* hero art */
  .art{position:relative;perspective:1200px}
  .art-card{background:#fff;border:1px solid var(--line);border-radius:24px;padding:1.15rem;
    box-shadow:0 30px 60px -30px rgba(13,18,32,.35);transform:rotate(-1.4deg)}
  .art-hero{height:186px;border-radius:16px;position:relative;overflow:hidden;
    background:linear-gradient(140deg,var(--accent),var(--accent-2))}
  .art-hero::after{content:"";position:absolute;inset:0;
    background:radial-gradient(60% 70% at 75% 20%,rgba(255,255,255,.42),transparent 60%),
               radial-gradient(50% 60% at 15% 90%,rgba(255,255,255,.22),transparent 65%)}
  .art-hero .tag{position:absolute;left:1rem;bottom:1rem;background:rgba(255,255,255,.94);
    border-radius:999px;padding:.32rem .75rem;font-size:.72rem;font-weight:700;color:var(--ink)}
  .art-lines{display:grid;gap:.5rem;margin-top:1.1rem}
  .art-lines i{display:block;height:9px;border-radius:5px;background:#eef0f6}
  .art-lines i:nth-child(1){width:72%;background:#e3e6f0}
  .art-lines i:nth-child(2){width:94%}
  .art-lines i:nth-child(3){width:58%}
  .art-row{display:flex;gap:.6rem;margin-top:1rem}
  .art-row b{flex:1;height:52px;border-radius:11px;background:var(--soft);border:1px solid var(--line)}
  .chip{position:absolute;background:#fff;border:1px solid var(--line);border-radius:14px;
    padding:.7rem .95rem;box-shadow:0 18px 40px -22px rgba(13,18,32,.45);display:flex;gap:.6rem;align-items:center}
  .chip strong{font-size:.95rem;display:block;line-height:1.1}
  .chip small{color:var(--muted);font-size:.7rem}
  .chip.c1{top:-22px;right:-14px;animation:float 6s ease-in-out infinite}
  .chip.c2{bottom:-24px;left:-18px;animation:float 7s ease-in-out infinite reverse}
  .chip-ico{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;
    background:rgba(var(--glow),.12);color:var(--accent)}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}

  /* stats */
  .band{background:var(--soft);border-block:1px solid var(--line);padding:2.2rem 0}
  .band-in{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
  .stat{text-align:center}
  .stat strong{display:block;font-size:clamp(1.6rem,2.6vw,2.15rem);font-weight:800;letter-spacing:-.03em;
    background:linear-gradient(120deg,var(--accent),var(--accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}
  .stat span{font-size:.85rem;color:var(--muted)}

  /* sections */
  section{padding:clamp(3.4rem,6vw,5.4rem) 0}
  .sec-head{max-width:44rem;margin-bottom:2.6rem}
  .sec-head h2{font-size:clamp(1.75rem,3.1vw,2.5rem);font-weight:800;margin:.7rem 0 0}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
  .card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:1.7rem;
    transition:.25s ease;box-shadow:0 1px 2px rgba(13,18,32,.03)}
  .card:hover{transform:translateY(-4px);box-shadow:var(--shadow);border-color:rgba(var(--glow),.35)}
  .card-ico{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;
    background:rgba(var(--glow),.1);color:var(--accent);margin-bottom:1.1rem}
  .card h3{font-size:1.08rem;font-weight:700;margin-bottom:.5rem}
  .card p{font-size:.94rem;color:var(--body)}

  .split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2rem,5vw,4rem);align-items:center}
  .panel{position:relative;border-radius:22px;min-height:330px;overflow:hidden;
    background:linear-gradient(150deg,rgba(var(--glow),.16),rgba(var(--glow),.05) 55%,#fff);
    border:1px solid var(--line);padding:1.5rem;display:grid;align-content:end;gap:.9rem}
  .panel .quote-card{background:#fff;border-radius:16px;padding:1.15rem 1.25rem;border:1px solid var(--line);box-shadow:var(--shadow)}
  .panel .quote-card p{font-size:.92rem;color:var(--body)}
  .panel .who{display:flex;align-items:center;gap:.65rem;margin-top:.85rem}
  .who .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-2));
    display:grid;place-items:center;color:#fff;font-size:.72rem;font-weight:700}
  .who strong{display:block;font-size:.85rem}
  .who small{color:var(--muted);font-size:.75rem}
  .checks{list-style:none;padding:0;margin:1.6rem 0 0;display:grid;gap:.8rem}
  .checks li{display:flex;gap:.7rem;font-size:.95rem;color:var(--body)}
  .split h2{font-size:clamp(1.7rem,2.9vw,2.35rem);font-weight:800;margin:.7rem 0 1rem}
  .split p.body{color:var(--body);font-size:1.02rem}

  .review{background:var(--soft);border-block:1px solid var(--line)}
  .review-card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:clamp(1.6rem,4vw,3rem);
    max-width:56rem;margin-inline:auto;text-align:center;box-shadow:var(--shadow)}
  .review-card blockquote{margin:1.2rem 0 1.6rem;font-size:clamp(1.1rem,2vw,1.42rem);line-height:1.5;
    font-weight:500;letter-spacing:-.015em;color:var(--ink)}
  .review-meta{display:flex;align-items:center;justify-content:center;gap:.7rem;font-size:.88rem;color:var(--muted)}

  .cta-band{position:relative;overflow:hidden;border-radius:26px;padding:clamp(2.2rem,5vw,3.6rem);
    background:linear-gradient(125deg,var(--accent),var(--accent-2));color:#fff;text-align:center;
    box-shadow:0 30px 60px -34px rgba(var(--glow),.9)}
  .cta-band::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(50% 80% at 85% 10%,rgba(255,255,255,.28),transparent 60%)}
  .cta-band h2{font-size:clamp(1.7rem,3.2vw,2.5rem);font-weight:800;position:relative}
  .cta-band p{position:relative;margin:.9rem auto 1.9rem;max-width:32rem;opacity:.94;font-size:1.02rem}
  .cta-band .btn{position:relative;background:#fff;color:var(--accent);box-shadow:0 16px 32px -18px rgba(0,0,0,.6)}

  /* contact */
  .contact-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(2rem,4vw,3.5rem)}
  .info{display:grid;gap:1.1rem;margin-top:1.9rem}
  .info-row{display:flex;gap:.9rem;align-items:flex-start}
  .info-row .card-ico{width:38px;height:38px;border-radius:11px;margin:0;flex:none}
  .info-row strong{display:block;font-size:.9rem}
  .info-row span{font-size:.9rem;color:var(--body)}
  form{background:#fff;border:1px solid var(--line);border-radius:20px;padding:clamp(1.3rem,3vw,2rem);box-shadow:var(--shadow)}
  .field{margin-bottom:1rem}
  .field label{display:block;font-size:.8rem;font-weight:600;margin-bottom:.4rem;color:var(--body)}
  .field input,.field textarea{width:100%;font:inherit;font-size:.94rem;padding:.75rem .9rem;border-radius:11px;
    border:1px solid var(--line);background:#fbfbfe;color:var(--ink);transition:.2s;resize:vertical}
  .field input:focus,.field textarea:focus{outline:none;border-color:var(--accent);background:#fff;
    box-shadow:0 0 0 3px rgba(var(--glow),.14)}
  .form-note{font-size:.78rem;color:var(--muted);margin-top:.8rem}
  .toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,140%);background:var(--ink);color:#fff;
    padding:.8rem 1.2rem;border-radius:12px;font-size:.9rem;transition:transform .35s cubic-bezier(.2,.8,.2,1);z-index:99}
  .toast.show{transform:translate(-50%,0)}

  footer{border-top:1px solid var(--line);padding:2.6rem 0 2rem;background:#fff}
  .foot-in{display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:space-between;align-items:flex-start}
  .foot-brand{max-width:20rem}
  .foot-brand p{font-size:.88rem;color:var(--muted);margin-top:.8rem}
  .foot-links{display:flex;gap:2.4rem;flex-wrap:wrap}
  .foot-col h4{font-size:.78rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:0 0 .8rem}
  .foot-col a{display:block;font-size:.9rem;color:var(--body);padding:.2rem 0}
  .foot-col a:hover{color:var(--accent)}
  .foot-bottom{margin-top:2.2rem;padding-top:1.4rem;border-top:1px solid var(--line);display:flex;
    flex-wrap:wrap;gap:.8rem;justify-content:space-between;font-size:.82rem;color:var(--muted)}
  .foot-bottom a{color:var(--accent);font-weight:600}

  .reveal{opacity:0;transform:translateY(16px);transition:opacity .6s ease var(--d,0ms),transform .6s ease var(--d,0ms)}
  .reveal.in{opacity:1;transform:none}
  @media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}.chip{animation:none}}

  @media (max-width:960px){
    .hero-grid,.split,.contact-grid{grid-template-columns:1fr}
    .art{order:-1;max-width:520px}
    .nav-links{display:none}
    .burger{display:inline-flex}
    .nav.open .nav-links{display:flex;position:absolute;top:72px;left:0;right:0;flex-direction:column;
      gap:0;background:#fff;border-bottom:1px solid var(--line);padding:.6rem 1.25rem 1.1rem;box-shadow:var(--shadow)}
    .nav.open .nav-links a{padding:.7rem 0;border-bottom:1px solid var(--line)}
    .grid3{grid-template-columns:1fr}
    .band-in{grid-template-columns:1fr;gap:1.8rem}
  }
  @media (max-width:600px){
    .nav-cta .btn{display:none}
    .hero-actions .btn{flex:1;justify-content:center}
    .chip.c1{right:-6px}.chip.c2{left:-6px}
    .foot-in{flex-direction:column}
  }
</style>
</head>
<body>
<header class="nav" id="nav">
  <div class="wrap nav-in">
    <a class="brand" href="#top"><span class="mark">${esc(initials(name))}</span>${esc(name)}</a>
    <nav class="nav-links">${navLinks}</nav>
    <div class="nav-cta">
      <a class="btn btn-primary" href="#contact">${esc(data.cta)} ${icon('arrow', 'ico')}</a>
      <button class="burger" id="burger" aria-label="Menu" aria-expanded="false">${icon('menu')}</button>
    </div>
  </div>
</header>

<main id="top">
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <span class="pill"><span class="dot"></span>${esc(data.badge)}</span>
        <h1>${esc(name)}<br /><span class="grad">${esc(data.headline)}</span></h1>
        <p class="lede">${esc(data.sub)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#contact">${esc(data.cta)} ${icon('arrow', 'ico')}</a>
          <a class="btn btn-ghost" href="#services">See what we do</a>
        </div>
        <div class="trust">
          <div class="avatars">
            <span style="background:linear-gradient(135deg,var(--accent),var(--accent-2))">${esc(initials(name))}</span>
            <span style="background:linear-gradient(135deg,#f59e0b,#f43f5e)">AR</span>
            <span style="background:linear-gradient(135deg,#0ea5e9,#6366f1)">VK</span>
            <span style="background:linear-gradient(135deg,#10b981,#22d3ee)">+</span>
          </div>
          <div><span class="stars">★★★★★</span> ${esc(data.stats[2].value)} from ${esc(data.stats[2].label)}</div>
        </div>
      </div>
      <div class="art">
        <div class="art-card">
          <div class="art-hero"><span class="tag">${esc(city)}</span></div>
          <div class="art-lines"><i></i><i></i><i></i></div>
          <div class="art-row"><b></b><b></b><b></b></div>
        </div>
        <div class="chip c1"><span class="chip-ico">${icon('shield')}</span><div><strong>Verified</strong><small>trusted locally</small></div></div>
        <div class="chip c2"><span class="chip-ico">${icon('clock')}</span><div><strong>${esc(data.stats[0].value)}</strong><small>${esc(data.stats[0].label)}</small></div></div>
      </div>
    </div>
  </section>

  <div class="band">
    <div class="wrap band-in">${stats}</div>
  </div>

  <section id="services">
    <div class="wrap">
      <div class="sec-head reveal">
        <span class="eyebrow">${icon('spark', 'ico')}${esc(data.sectionKicker)}</span>
        <h2>${esc(data.sectionTitle)}</h2>
      </div>
      <div class="grid3">${serviceCards}</div>
    </div>
  </section>

  <section id="about" style="padding-top:0">
    <div class="wrap split">
      <div class="panel reveal">
        <div class="quote-card">
          <p>“${esc(data.testimonial.quote)}”</p>
          <div class="who">
            <span class="av">${esc(initials(data.testimonial.name))}</span>
            <div><strong>${esc(data.testimonial.name)}</strong><small>${esc(data.testimonial.role)}</small></div>
          </div>
        </div>
      </div>
      <div class="reveal">
        <span class="eyebrow">${icon('heart', 'ico')}About us</span>
        <h2>${esc(name)}, in ${esc(city.split(',')[0])}</h2>
        <p class="body">${esc(about)}</p>
        <ul class="checks">${checklist}</ul>
      </div>
    </div>
  </section>

  <section class="review" id="reviews">
    <div class="wrap">
      <div class="review-card reveal">
        <span class="stars" style="font-size:1rem">★★★★★</span>
        <blockquote>“${esc(data.testimonial.quote)}”</blockquote>
        <div class="review-meta"><strong>${esc(data.testimonial.name)}</strong> · ${esc(data.testimonial.role)}</div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="cta-band reveal">
        <h2>${esc(data.cta)}</h2>
        <p>${esc(data.sub)}</p>
        <a class="btn" href="#contact">Get in touch ${icon('arrow', 'ico')}</a>
      </div>
    </div>
  </section>

  <section id="contact" style="padding-top:0">
    <div class="wrap contact-grid">
      <div>
        <span class="eyebrow">${icon('mail', 'ico')}Contact</span>
        <h2 style="font-size:clamp(1.7rem,2.9vw,2.35rem);font-weight:800;margin:.7rem 0 1rem">Tell us what you need</h2>
        <p style="color:var(--body)">Send a note and we reply the same working day. No forms that disappear into a void.</p>
        <div class="info">
          <div class="info-row"><span class="card-ico">${icon('mail')}</span><div><strong>Email</strong><span>${esc(email)}</span></div></div>
          <div class="info-row"><span class="card-ico">${icon('phone')}</span><div><strong>Phone</strong><span>${esc(phone)}</span></div></div>
          <div class="info-row"><span class="card-ico">${icon('pin')}</span><div><strong>Where we are</strong><span>${esc(city)}</span></div></div>
          <div class="info-row"><span class="card-ico">${icon('clock')}</span><div><strong>Hours</strong><span>Mon–Sat, 9:00 – 20:00</span></div></div>
        </div>
      </div>
      <form id="lead-form" novalidate>
        <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" placeholder="Full name" required /></div>
        <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" placeholder="you@example.com" required /></div>
        <div class="field"><label for="f-msg">What can we help with?</label><textarea id="f-msg" name="message" rows="4" placeholder="A sentence or two is plenty"></textarea></div>
        <button class="btn btn-primary" type="submit" style="width:100%;justify-content:center">Send message ${icon('arrow', 'ico')}</button>
        <p class="form-note">This is a generated demo form — submissions are stored in the browser only.</p>
      </form>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <div class="foot-in">
      <div class="foot-brand">
        <a class="brand" href="#top"><span class="mark">${esc(initials(name))}</span>${esc(name)}</a>
        <p>${esc(data.sub)}</p>
      </div>
      <div class="foot-links">
        <div class="foot-col"><h4>Explore</h4><a href="#services">Services</a><a href="#about">About</a><a href="#reviews">Reviews</a></div>
        <div class="foot-col"><h4>Reach us</h4><a href="#contact">Contact</a><a href="mailto:${esc(email)}">${esc(email)}</a><a href="tel:${esc(phone.replace(/\s/g, ''))}">${esc(phone)}</a></div>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${year} ${esc(name)}. All rights reserved.</span>
      <span>Hosted at <a href="https://${esc(host)}">${esc(host)}</a> · Built with Orbit</span>
    </div>
  </div>
</footer>
<div class="toast" id="toast">Thanks — your message is queued.</div>

<script>
(function () {
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  if (burger) burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); });
  });

  var toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  var form = document.getElementById('lead-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = (form.querySelector('#f-name').value || '').trim();
    var email = (form.querySelector('#f-email').value || '').trim();
    if (!name || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      showToast('Please add your name and a valid email.');
      return;
    }
    try {
      var key = 'orbit-leads-${esc(slug)}';
      var leads = JSON.parse(localStorage.getItem(key) || '[]');
      leads.push({ name: name, email: email, message: form.querySelector('#f-msg').value, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(leads));
    } catch (err) { /* storage can be blocked; the demo still confirms */ }
    form.reset();
    showToast('Thanks ' + name.split(' ')[0] + ' — we will reply today.');
  });

  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }
})();
</script>
</body>
</html>`;
}

module.exports = { buildSite, INDUSTRIES, THEMES, slugify, esc };
