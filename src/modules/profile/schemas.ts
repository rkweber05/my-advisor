import { z } from "zod";

import { nameSchema } from "@/modules/auth/schemas";

// Fusos do Brasil, mostrados primeiro na tela. Os demais vêm da lista IANA do ambiente.
export const BRAZIL_TIMEZONES = [
  "America/Sao_Paulo",
  "America/Bahia",
  "America/Fortaleza",
  "America/Recife",
  "America/Maceio",
  "America/Belem",
  "America/Araguaina",
  "America/Santarem",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Manaus",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Rio_Branco",
  "America/Eirunepe",
  "America/Noronha",
] as const;

export function otherTimezones(): string[] {
  const brazil: readonly string[] = BRAZIL_TIMEZONES;
  return Intl.supportedValuesOf("timeZone").filter(
    (timezone) => !brazil.includes(timezone),
  );
}

function isKnownTimezone(value: string): boolean {
  return (
    (BRAZIL_TIMEZONES as readonly string[]).includes(value) ||
    Intl.supportedValuesOf("timeZone").includes(value)
  );
}

export const profileSchema = z.object({
  name: nameSchema,
  timezone: z
    .string()
    .refine(isKnownTimezone, { error: "Escolha um fuso horário da lista." }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
