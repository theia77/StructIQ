import type { Metadata } from "next";
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: "StructEngine Pro",
  description: "Advanced structural beam analysis tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
