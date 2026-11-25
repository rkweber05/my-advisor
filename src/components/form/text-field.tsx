import { useId } from "react";

import { Input } from "@/components/ui/input";

import { describedBy, fieldControlClass, FieldShell } from "./field-shell";

type TextFieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, ...props }: TextFieldProps) {
  const id = useId();

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={fieldControlClass}
        {...props}
      />
    </FieldShell>
  );
}
