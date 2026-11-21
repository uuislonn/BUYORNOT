import type { Metadata } from "next";
import "./globals.css";
import { BackToTop } from "../components/back-to-top";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "BUYORNOT",
  description: "함께 고르는 구매 고민 투표 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <SiteFooter />
        <BackToTop />
      </body>
    </html>
  );
}
