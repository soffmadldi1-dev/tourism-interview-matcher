import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "관광 취업 준비 워크벤치 | 기업 조사부터 면접 준비까지",
  description:
    "관광 산업 취업 준비생을 위한 무료 도구. 기업 조사용 검색 링크를 만들어 주고, 이력서·자기소개서·면접 스크립트를 만드는 완성형 프롬프트를 제공합니다. 로그인도 결제도 필요 없습니다.",
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
