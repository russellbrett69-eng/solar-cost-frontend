import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Cost Frontend",
  description: "Supabase + Next.js demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="min-h-screen">
      {/* suppressHydrationWarning avoids dev overlays from extensions like Grammarly */}
      <body
        className="min-h-screen bg-background text-foreground font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
