import type { Metadata, Viewport } from "next";
import { Figtree, Space_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Figtree (round and friendly) for everything, Space Mono for the bookish details (authors, numbers, metadata).
const figtree = Figtree({ variable: "--font-body", subsets: ["latin"] });
const mono = Space_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Estante ELi",
  description: "Graded readers em inglês em ordem de dificuldade, com caderno de vocabulário, flashcards e kits de estudo.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${figtree.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <Toaster richColors position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
