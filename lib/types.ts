/**
 * 관광 특화 기업 분석 · 면접 스토리 매칭 툴 — 공용 타입
 * 데이터 구조의 단일 원천(single source of truth)은 lib/schemas.ts 의 Zod 스키마이며,
 * 여기서는 그로부터 파생된 타입과 UI/전송 계층 전용 타입만 정의합니다.
 */

import type {
  CandidateProfileInput,
  CompanyIntelCore,
  CompanySearchInput,
  StoryPackage,
} from "@/lib/schemas";

export type {
  CandidateProfileInput,
  CompanyIntelCore,
  CompanySearchInput,
  StoryPackage,
};

/** 관광 산업 세부 업종 프리셋 */
export type TourismSector =
  | "hotel" // 호텔 / 리조트
  | "ota" // 여행사 / OTA / 플랫폼
  | "public" // 공공기관 / DMO / 재단
  | "mice" // MICE / 컨벤션 / 전시
  | "transport" // 항공 / 크루즈 / 교통
  | "other"; // 기타 · 직접 입력

/** 생성 산출물의 톤앤매너 */
export type ToneKey = "confident" | "calm" | "global";

/** 검색 공급자 */
export type SearchProvider =
  | "tavily"
  | "serper"
  | "perplexity"
  | "native" // Claude 내장 web_search 서버 도구
  | "none"; // 검색 없이 LLM 사전지식으로 폴백

/** 외부 검색 API에서 정규화한 검색 결과 1건 */
export interface SearchHit {
  title: string;
  url: string;
  /** 본문 발췌 */
  content: string;
  /** 발행일 (있을 때만) */
  publishedAt?: string;
}

/** 검색 수행 결과 메타데이터 (UI 배지 · 신뢰도 표기용) */
export interface RetrievalMeta {
  provider: SearchProvider;
  queries: string[];
  resultCount: number;
  /** 외부 검색이 실패해 폴백 경로를 탄 경우 true */
  fallbackUsed: boolean;
  /** 사용자에게 노출할 안내 문구 */
  notice: string;
}

/** Step 1 최종 산출물 = LLM 구조화 결과 + 수집 메타 */
export type CompanyIntel = CompanyIntelCore & {
  sector: TourismSector;
  retrieval: RetrievalMeta;
};

/** Step 2 입력 (UI 폼 값) */
export type CandidateProfile = CandidateProfileInput;

/** ── API 공용 응답 래퍼 ────────────────────────────────────── */

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "MISSING_API_KEY"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "SEARCH_FAILED"
  | "PARSE_FAILED"
  | "TIMEOUT"
  | "UNKNOWN";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** 사용자가 취할 수 있는 조치 */
  hint?: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/** 진행 상태 (우측 패널 로딩 인디케이터) */
export type StepStatus = "idle" | "loading" | "done" | "error";
