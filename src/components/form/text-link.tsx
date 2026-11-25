import Link from "next/link";

// Link de texto com área de toque de 44 px.
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-md font-medium text-primary underline outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </Link>
  );
}
