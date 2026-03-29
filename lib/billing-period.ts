import { addDays, parseISO, startOfDay, subMonths, differenceInCalendarMonths } from 'date-fns';

export const MAX_TRANSACTION_RANGE_MONTHS = 24;

export type BillingPeriodBounds = {
  /** Inklusif awal hari (UTC date dari string) */
  rangeStart: Date;
  /** Eksklusif — sama dengan awal hari setelah `to` kalender */
  rangeEndExclusive: Date;
};

/**
 * Menormalisasi query `from` / `to` (YYYY-MM-DD) untuk WHERE created_at >= rangeStart AND created_at < rangeEndExclusive
 * agar partition pruning RANGE(created_at) bekerja.
 */
export function parseTransactionPeriod(
  fromStr: string | null,
  toStr: string | null
): BillingPeriodBounds {
  const today = startOfDay(new Date());
  const toDate = toStr ? startOfDay(parseISO(toStr)) : today;
  const fromDate = fromStr ? startOfDay(parseISO(fromStr)) : subMonths(toDate, 12);

  if (fromDate > toDate) {
    throw new Error('Parameter from harus sebelum atau sama dengan to');
  }

  const months = differenceInCalendarMonths(toDate, fromDate);
  if (months > MAX_TRANSACTION_RANGE_MONTHS) {
    throw new Error(`Rentang maksimal ${MAX_TRANSACTION_RANGE_MONTHS} bulan`);
  }

  const rangeStart = fromDate;
  const rangeEndExclusive = addDays(toDate, 1);

  return { rangeStart, rangeEndExclusive };
}

/** Batas bulan (UTC) untuk mempersempit scan partisi detail saat join ke header */
export function monthBoundsForTimestamp(ts: Date): { monthStart: Date; monthEndExclusive: Date } {
  const y = ts.getUTCFullYear();
  const m = ts.getUTCMonth();
  const monthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const monthEndExclusive = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  return { monthStart, monthEndExclusive };
}
