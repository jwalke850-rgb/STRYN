import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STRYN Operator Console",
  description: "Reduce → Reframe → Move → Pressure-test → Integrate",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
