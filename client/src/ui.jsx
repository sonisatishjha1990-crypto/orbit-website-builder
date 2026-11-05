import { useEffect, useRef, useState } from 'react';

const P = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" /></>,
  sparkles: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" /></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  arrowLeft: <><path d="M19 12H5M11 18l-6-6 6-6" /></>,
  external: <><path d="M14 4h6v6M20 4l-8.5 8.5" /><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 012-2h8" /></>,
  check: <><path d="M4 12.5l5 5L20 6.5" /></>,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" /></>,
  refresh: <><path d="M20 11a8 8 0 10-2.3 5.7" /><path d="M20 5v6h-6" /></>,
  chevron: <><path d="M6 9l6 6 6-6" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" /></>,
  code: <><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" /></>,
  zap: <><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></>,
  shield: <><path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chart: <><path d="M4 20V6M10 20V10M16 20V4M22 20H2" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5M3 17l9 5 9-5" /></>,
  rocket: <><path d="M5 15c-1.5 1.5-1.5 5 0 5s3.5 0 5-1.5" /><path d="M14.5 4.5C18 3 21 3 21 3s0 3-1.5 6.5C17.5 14 12 18 12 18l-6-6s4-5.5 8.5-7.5z" /><circle cx="15.5" cy="8.5" r="1.6" /></>,
  loader: <><path d="M12 3a9 9 0 109 9" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  phone: <><path d="M6 3h3l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v3a2 2 0 01-2.2 2A16 16 0 014 5.2 2 2 0 016 3z" /></>,
  pin: <><path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>,
  eye: <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 007.5 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 15H3a2 2 0 110-4h.1A1.6 1.6 0 004.6 8.5l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 5.6V5a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" /></>,
  desktop: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M9 20h6M12 16v4" /></>,
  mobile: <><rect x="7" y="3" width="10" height="18" rx="2.4" /><path d="M11 18h2" /></>,
  link: <><path d="M10 13a5 5 0 007.1 0l1.9-1.9a5 5 0 00-7.1-7.1L10.5 5.4" /><path d="M14 11a5 5 0 00-7.1 0L5 12.9a5 5 0 007.1 7.1l1.4-1.4" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></>,
  lock: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>
};

export function Icon({ name, className = 'h-4 w-4', strokeWidth = 1.7 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[name] || P.sparkles}
    </svg>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <Icon name="loader" className={`${className} animate-spin`} />;
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-dim/80">{hint}</p>}
    </div>
  );
}

export function Badge({ tone = 'default', children }) {
  const tones = {
    default: 'border-line bg-panel2 text-dim',
    live: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    building: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    accent: 'border-accent/40 bg-accent/10 text-indigo-300'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}

export function CopyButton({ value, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const el = document.createElement('textarea');
        el.value = value;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        el.remove();
      }
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-dim transition hover:border-accent/50 hover:text-ink ${className}`}
    >
      <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
      {copied ? 'Copied' : label}
    </button>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const tone = toast.type === 'error' ? 'border-rose-500/40 text-rose-200' : 'border-emerald-500/40 text-emerald-200';
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
      <div className={`rise flex items-center gap-2.5 rounded-xl border bg-panel px-4 py-3 text-sm font-medium shadow-2xl ${tone}`}>
        <Icon name={toast.type === 'error' ? 'alert' : 'check'} className="h-4 w-4" />
        {toast.message}
      </div>
    </div>
  );
}
