"use client";

import { EMPTY_CONTEXT, type PromptContext } from "@/lib/types";

/**
 * 입력값을 브라우저에 저장합니다.
 *
 * 교육 현장에서 실수로 새로고침하거나 탭을 닫아도 작업이 날아가지 않도록 하기 위함입니다.
 * 서버로 전송되는 것은 없습니다 — 데이터는 사용자 브라우저 밖으로 나가지 않습니다.
 */

const STORAGE_KEY = "tourism-matcher:draft:v1";

export function loadContext(): PromptContext {
  if (typeof window === "undefined") return EMPTY_CONTEXT;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CONTEXT;

    const parsed = JSON.parse(raw) as Partial<PromptContext>;
    // 저장 형식이 바뀌었을 수 있으니 기본값 위에 덮어씁니다.
    return {
      ...EMPTY_CONTEXT,
      ...parsed,
      strengthTags: Array.isArray(parsed.strengthTags) ? parsed.strengthTags : [],
    };
  } catch {
    return EMPTY_CONTEXT;
  }
}

export function saveContext(context: PromptContext): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // 저장 공간이 꽉 찼거나 시크릿 모드인 경우 — 조용히 넘어갑니다.
  }
}

export function clearContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}
