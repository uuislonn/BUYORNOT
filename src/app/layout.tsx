import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BUYORNOT",
  description: "함께 고르는 구매 고민 투표 커뮤니티",
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
