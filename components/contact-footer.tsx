"use client";

import { MessageCircle } from "lucide-react";

const KAKAO_URL = "https://open.kakao.com/me/yosepAI";
const HOMEPAGE_URL = "https://hongyosep-profile.vercel.app/";

/**
 * 문의 채널 안내.
 * 교육생이 막혔을 때 바로 질문할 곳을 찾을 수 있어야 합니다.
 */
export function ContactFooter() {
  return (
    <div className="space-y-3 pb-4">
      <a
        href={KAKAO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-xl border-2 border-[#3C1E1E]/15 bg-[#FEE500] p-4 transition-transform hover:scale-[1.01]"
      >
        <span className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 shrink-0 text-[#3C1E1E]" />
          <span>
            <span className="block text-sm font-bold text-[#3C1E1E]">
              요셉쌤 AI문서연구소
            </span>
            <span className="block text-xs text-[#3C1E1E]/75">
              완성 서류 2차 클리닉 · 질문 환영
            </span>
          </span>
        </span>
        <span className="hidden shrink-0 text-xs font-semibold text-[#3C1E1E] sm:block">
          open.kakao.com/me/yosepAI
        </span>
      </a>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        요셉쌤 AI문서연구소 · 이력서·자소서·포트폴리오 프롬프트 메이커
        <br />
        문의:{" "}
        <a
          href={KAKAO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          카카오 오픈채팅
        </a>
        {" 　|　 "}
        <a
          href={HOMEPAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          홍요셉 강사 공식홈페이지
        </a>
      </p>
    </div>
  );
}
