import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "관광 면접 스토리 매처 | 기업 분석 × 경험 매칭",
  description:
    "관광 산업 취업·이직 준비생을 위한 기업 분석 및 면접 스토리 매칭 툴. 실시간 웹 검색으로 기업 현안을 파악하고, 내 경험과 1:1로 연결한 면접 답변을 만듭니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a6f80",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
