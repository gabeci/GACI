import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GACI MVP v0.1.3",
  description: "Emotion → Meaning → Alignment Action"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
