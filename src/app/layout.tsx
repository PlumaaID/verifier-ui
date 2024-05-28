import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "~/lib/utils";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import Topbar from "~/components/topbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Plumaa ID Verifier",
  description: "Verifica documentos, firmas y endosos electrónicos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        suppressHydrationWarning
        className={cn(
          "mainh-screen h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Topbar />
          <div className="max-w-6xl pt-16 mx-auto px-8">{children}</div>
        </NextThemesProvider>
      </body>
    </html>
  );
}
