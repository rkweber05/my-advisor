// "Hoje" e o mês corrente dependem do fuso do perfil, nunca do fuso do servidor (L-09).

// Data de calendário, sem hora, no formato "AAAA-MM-DD".
export function todayIn(timezone: string, now: Date = new Date()): string {
  // O formato canadense já sai como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Mês corrente no formato "AAAA-MM".
export function currentMonthIn(timezone: string, now: Date = new Date()) {
  return todayIn(timezone, now).slice(0, 7);
}
