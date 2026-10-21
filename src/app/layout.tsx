import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BUYORNOT",
  description: "BUYORNOT 공동 개발 환경",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
