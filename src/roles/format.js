/*
 * Language-aware number / date formatting shared by the shell and the dashboards.
 * Pure (Intl only) so it can also run in Node.
 */

const LOCALES = { fr: 'fr-DZ', en: 'en-US', ar: 'ar-DZ' };
const BILLION_UNIT = { fr: 'Mds DZD', en: 'bn DZD', ar: 'مليار د.ج' };
const POINTS_UNIT = { fr: 'pts', en: 'pts', ar: 'نقطة' };

export function createFormatters(lang = 'fr') {
  const locale = LOCALES[lang] ?? LOCALES.fr;
  const number = (value, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value ?? 0);
  const dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const toDate = (value) => (value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`));

  return {
    locale,
    int: (value) => number(value, 0),
    number,
    percent: (value, digits = 0) => `${number(value, digits)}${lang === 'fr' ? ' ' : ''}%`,
    /** Signed difference in percentage points, e.g. "−6,6 pts". */
    points: (value, digits = 1) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits, signDisplay: 'exceptZero' }).format(value ?? 0)} ${POINTS_UNIT[lang] ?? POINTS_UNIT.fr}`,
    billions: (value, digits = 1) => (value == null ? '—' : `${number(value / 1_000_000_000, digits)} ${BILLION_UNIT[lang] ?? BILLION_UNIT.fr}`),
    dzd: (value) => (value == null ? '—' : new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value)),
    date: (value) => {
      if (!value) return '—';
      const date = toDate(value);
      return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
    }
  };
}
