const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function previousDay(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

// "Hoje", "Ontem" ou "23 de novembro". As datas são de calendário, sem hora nem fuso.
export function dayLabel(date: string, today: string): string {
  if (date === today) return "Hoje";
  if (date === previousDay(today)) return "Ontem";
  return dayFormat.format(new Date(`${date}T00:00:00Z`));
}

// "novembro de 2026" a partir de "2026-11".
export function monthLabel(month: string): string {
  return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}
