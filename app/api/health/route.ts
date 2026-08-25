import { NextResponse } from "next/server";
import { DEFAULT_MODEL } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 환경 설정 점검용 엔드포인트.
 * 키 값 자체는 절대 반환하지 않고, 설정 여부(boolean)만 노출합니다.
 *   curl http://localhost:3000/api/health
 */
export function GET() {
  const searchKeys = {
    tavily: Boolean(process.env.TAVILY_API_KEY?.trim()),
    serper: Boolean(process.env.SERPER_API_KEY?.trim()),
    perplexity: Boolean(process.env.PERPLEXITY_API_KEY?.trim()),
  };

  const anySearch = Object.values(searchKeys).some(Boolean);

  return NextResponse.json({
    ok: true,
    model: DEFAULT_MODEL,
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    searchKeys,
    searchProvider: process.env.SEARCH_PROVIDER ?? "auto",
    notes: [
      process.env.ANTHROPIC_API_KEY?.trim()
        ? "Claude API 키가 설정되어 있습니다."
        : "⚠️ ANTHROPIC_API_KEY 가 없습니다. .env.local 을 확인하세요.",
      anySearch
        ? "외부 웹 검색 API가 설정되어 있습니다."
        : "외부 검색 키가 없어 Claude 내장 web_search 로 폴백합니다.",
    ],
  });
}
