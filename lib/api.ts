import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiError, ApiErrorCode, ApiResult } from "@/lib/types";
import { toApiError } from "@/lib/anthropic";

/** Route Handler 공용 응답 헬퍼 */

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  MISSING_API_KEY: 500,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  SEARCH_FAILED: 502,
  PARSE_FAILED: 502,
  TIMEOUT: 504,
  UNKNOWN: 500,
};

export function ok<T>(data: T): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data } as const);
}

export function fail(error: ApiError): NextResponse<ApiResult<never>> {
  return NextResponse.json({ ok: false, error } as const, {
    status: STATUS_BY_CODE[error.code] ?? 500,
  });
}

/** 요청 본문을 Zod 로 파싱. 실패 시 첫 번째 에러 메시지를 그대로 노출합니다. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; error: ApiError }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      error: { code: "INVALID_INPUT", message: "요청 본문이 올바른 JSON이 아닙니다." },
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: first?.message ?? "입력값이 올바르지 않습니다.",
        hint: first?.path.length ? `문제 필드: ${first.path.join(".")}` : undefined,
      },
    };
  }

  return { ok: true, data: parsed.data };
}

/** 예외를 ApiError 로 변환. lib/anthropic 의 __apiCode 힌트를 우선 반영합니다. */
export function normalizeError(err: unknown): ApiError {
  if (err && typeof err === "object" && "__apiCode" in err) {
    return {
      code: (err as { __apiCode: ApiErrorCode }).__apiCode,
      message: err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.",
    };
  }
  return toApiError(err);
}
