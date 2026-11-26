const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type MonthRange = {
  // Primeiro dia do mês.
  start: string;
  // Primeiro dia do mês seguinte: o período é [start, endExclusive).
  endExclusive: string;
};

function monthKey(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function parseMonth(month: string): { year: number; month: number } | null {
  const match = MONTH_PATTERN.exec(month);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

// Desloca um mês "AAAA-MM" em `delta` meses. Devolve `null` se o texto não for um mês.
export function shiftMonth(month: string, delta: number): string | null {
  const parsed = parseMonth(month);
  if (!parsed) return null;

  const index = parsed.year * 12 + (parsed.month - 1) + delta;
  return monthKey(Math.floor(index / 12), (index % 12) + 1);
}

export function monthRange(month: string): MonthRange | null {
  const next = shiftMonth(month, 1);
  if (!next) return null;
  return { start: `${month}-01`, endExclusive: `${next}-01` };
}

// Confere se "AAAA-MM-DD" é uma data que existe no calendário (recusa 2026-02-30).
export function isCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const [year, month, day] = [match[1], match[2], match[3]].map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 0) - 1 &&
    date.getUTCDate() === day
  );
}
