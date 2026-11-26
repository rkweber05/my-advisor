import { describe, expect, it } from "vitest";

import { isCalendarDate, monthRange, shiftMonth } from "@/lib/dates/month";
import { currentMonthIn, todayIn } from "@/lib/dates/today";

describe("todayIn", () => {
  // 01:30 UTC do dia 1º de dezembro ainda é 30 de novembro em São Paulo (UTC-3).
  const afterMidnightUtc = new Date("2026-12-01T01:30:00Z");

  it("usa o fuso do perfil, não o do servidor", () => {
    expect(todayIn("America/Sao_Paulo", afterMidnightUtc)).toBe("2026-11-30");
    expect(todayIn("UTC", afterMidnightUtc)).toBe("2026-12-01");
    expect(todayIn("America/Rio_Branco", afterMidnightUtc)).toBe("2026-11-30");
    expect(todayIn("Asia/Tokyo", afterMidnightUtc)).toBe("2026-12-01");
  });

  it("o mês corrente vira junto com o dia do perfil", () => {
    expect(currentMonthIn("America/Sao_Paulo", afterMidnightUtc)).toBe(
      "2026-11",
    );
    expect(currentMonthIn("UTC", afterMidnightUtc)).toBe("2026-12");
  });

  it("vira o ano no fuso do perfil", () => {
    const newYearUtc = new Date("2027-01-01T02:00:00Z");

    expect(todayIn("America/Sao_Paulo", newYearUtc)).toBe("2026-12-31");
  });
});

describe("monthRange", () => {
  it("devolve o primeiro dia do mês e o primeiro do mês seguinte", () => {
    expect(monthRange("2026-11")).toEqual({
      start: "2026-11-01",
      endExclusive: "2026-12-01",
    });
  });

  it("vira o ano em dezembro", () => {
    expect(monthRange("2026-12")).toEqual({
      start: "2026-12-01",
      endExclusive: "2027-01-01",
    });
  });

  it.each(["2026-13", "2026-00", "2026-1", "novembro", "", "2026-11-01"])(
    "recusa %s",
    (month) => {
      expect(monthRange(month)).toBeNull();
    },
  );
});

describe("shiftMonth", () => {
  it.each([
    ["2026-11", 1, "2026-12"],
    ["2026-12", 1, "2027-01"],
    ["2026-01", -1, "2025-12"],
    ["2026-03", -14, "2025-01"],
    ["2026-06", 0, "2026-06"],
  ])("%s deslocado em %i dá %s", (month, delta, expected) => {
    expect(shiftMonth(month, delta)).toBe(expected);
  });
});

describe("isCalendarDate", () => {
  it.each(["2026-11-25", "2028-02-29", "2026-12-31"])("aceita %s", (date) => {
    expect(isCalendarDate(date)).toBe(true);
  });

  it.each([
    "2026-02-30",
    "2026-02-29",
    "2026-13-01",
    "25/11/2026",
    "",
    "2026-1-5",
  ])("recusa %s", (date) => {
    expect(isCalendarDate(date)).toBe(false);
  });
});
