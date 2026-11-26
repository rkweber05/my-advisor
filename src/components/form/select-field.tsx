import { useId } from "react";

import { describedBy, fieldControlClass, FieldShell } from "./field-shell";

type SelectFieldProps = Omit<React.ComponentProps<"select">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
};

// Lista nativa do sistema: funciona bem no celular e não depende de estilo inline (CSP).
export function SelectField({
  label,
  hint,
  error,
  children,
  ...props
}: SelectFieldProps) {
  const id = useId();

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${fieldControlClass} w-full rounded-lg border border-input outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
