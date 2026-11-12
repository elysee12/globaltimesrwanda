/**
 * Date formatting utilities for Global Times Rwanda.
 * Supports EN, FR, and RW (Kinyarwanda) with full manual translation
 * for RW since browsers don't support the rw-RW locale natively.
 */

export type DateLanguage = 'EN' | 'RW' | 'FR';

// ---------------------------------------------------------------------------
// Kinyarwanda month & day names (manual — no browser Intl support for rw-RW)
// ---------------------------------------------------------------------------

const RW_MONTHS_LONG = [
  'Mutarama',   // January   1
  'Gashyantare', // February  2
  'Werurwe',    // March      3
  'Mata',       // April      4
  'Gicurasi',   // May        5
  'Kamena',     // June       6
  'Nyakanga',   // July       7
  'Kanama',     // August     8
  'Nzeli',      // September  9
  'Ukwakira',   // October   10
  'Ugushyingo', // November  11
  'Ukuboza',    // December  12
];

const RW_MONTHS_SHORT = [
  'Mut', 'Gas', 'Wer', 'Mat', 'Gic', 'Kam',
  'Nya', 'Kan', 'Nze', 'Ukw', 'Ugu', 'Uku',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Formats a date in Kinyarwanda manually since rw-RW is not a supported
 * browser locale.
 * Output: "15 Mutarama 2026"
 */
function formatRwDate(d: Date, short = false): string {
  const months = short ? RW_MONTHS_SHORT : RW_MONTHS_LONG;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formats time in Kinyarwanda (24-hour clock).
 * Output: "10:03"
 */
function formatRwTime(d: Date): string {
  return `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Formats a date into a readable publication date.
 *
 * EN: "January 15, 2026"
 * FR: "15 janvier 2026"
 * RW: "15 Mutarama 2026"
 */
export function formatArticleDate(
  date: string | Date | null | undefined,
  lang: DateLanguage = 'EN',
): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (lang === 'RW') return formatRwDate(d);
    const locale = lang === 'FR' ? 'fr-FR' : 'en-US';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Formats a date with time for article detail pages.
 *
 * EN: "January 15, 2026 · 10:03 AM"
 * FR: "15 janvier 2026 · 10:03"
 * RW: "15 Mutarama 2026 · 10:03"
 */
export function formatArticleDateTime(
  date: string | Date | null | undefined,
  lang: DateLanguage = 'EN',
): string {
  if (!date) return '';
  try {
    const d = new Date(date);

    if (lang === 'RW') {
      return `${formatRwDate(d)} · ${formatRwTime(d)}`;
    }

    const locale = lang === 'FR' ? 'fr-FR' : 'en-US';
    const datePart = d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timePart = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: lang === 'EN',
    });
    return `${datePart} · ${timePart}`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Relative time strings per language
// ---------------------------------------------------------------------------

const RELATIVE: Record<DateLanguage, {
  justNow: string;
  minsAgo:  (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo:  (n: number) => string;
}> = {
  EN: {
    justNow:  'Just now',
    minsAgo:  (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo:  (n) => `${n}d ago`,
  },
  RW: {
    justNow:  'Nonaha',
    minsAgo:  (n) => `Iminota ${n} ishize`,
    hoursAgo: (n) => `Amasaha ${n} ashize`,
    daysAgo:  (n) => `Iminsi ${n} ishize`,
  },
  FR: {
    justNow:  "À l'instant",
    minsAgo:  (n) => `il y a ${n} min`,
    hoursAgo: (n) => `il y a ${n} h`,
    daysAgo:  (n) => `il y a ${n} j`,
  },
};

/**
 * Returns a relative time string for recent articles, falls back to full date.
 *
 * EN: "2h ago" → "Jan 15, 2026"
 * FR: "il y a 2 h" → "15 janv. 2026"
 * RW: "Amasaha 2 ashize" → "15 Mut 2026"
 */
export function formatRelativeDate(
  date: string | Date | null | undefined,
  lang: DateLanguage = 'EN',
): string {
  if (!date) return '';
  try {
    const d   = new Date(date);
    const now = new Date();
    const diffMs    = now.getTime() - d.getTime();
    const diffMins  = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays  = Math.floor(diffHours / 24);
    const r = RELATIVE[lang];

    if (diffMins  < 1)  return r.justNow;
    if (diffMins  < 60) return r.minsAgo(diffMins);
    if (diffHours < 24) return r.hoursAgo(diffHours);
    if (diffDays  < 7)  return r.daysAgo(diffDays);

    // Older than 7 days → short date
    if (lang === 'RW') return formatRwDate(d, true); // "15 Mut 2026"
    const locale = lang === 'FR' ? 'fr-FR' : 'en-US';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
