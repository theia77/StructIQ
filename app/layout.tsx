import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beam Calculator",
  description: "Structural beam analysis tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
