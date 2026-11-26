import { Label } from "@/components/ui/label";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export const fieldControlClass =
  "h-12 bg-card px-3 text-base md:text-base aria-invalid:border-danger-strong";

// Ids do texto de apoio e do erro, para ligar o campo a eles (aria-describedby).
export function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm font-medium text-danger-strong"
        >
          {error}
        </p>
      )}
    </div>
  );
}
