import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  pending: boolean;
  pendingLabel: string;
  disabled?: boolean;
  variant?: "default" | "destructive";
  children: React.ReactNode;
};

export function SubmitButton({
  pending,
  pendingLabel,
  disabled = false,
  variant = "default",
  children,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending || disabled}
      className="h-12 w-full text-base"
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
