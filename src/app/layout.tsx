import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meu Advisor",
  description: "Seu dinheiro, sob controle.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // O nonce da CSP só existe durante uma requisição: nenhuma página pode ser gerada no build.
  await connection();

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
