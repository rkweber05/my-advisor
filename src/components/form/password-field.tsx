"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";

import { describedBy, fieldControlClass, FieldShell } from "./field-shell";

type PasswordFieldProps = Omit<React.ComponentProps<"input">, "id" | "type"> & {
  label: string;
  hint?: string;
  error?: string;
};

// Um campo só, com botão de mostrar e ocultar: substitui o "repita a senha".
export function PasswordField({
  label,
  hint,
  error,
  ...props
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${fieldControlClass} pr-13`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Icon aria-hidden className="size-5" />
        </button>
      </div>
    </FieldShell>
  );
}
