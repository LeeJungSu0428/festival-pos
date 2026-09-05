import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "애국한양응원제 : 오름",
  description: "애국한양응원제 오름 - 현장 판매·재고·굿즈 관리 시스템",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
