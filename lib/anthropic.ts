import Anthropic from "@anthropic-ai/sdk";
import type { ApiError } from "@/lib/types";

/**
 * Anthropic 클라이언트 팩토리 + 에러 정규화.
 * 반드시 서버(Route Handler)에서만 import 하세요. API 키가 클라이언트로 새면 안 됩니다.
 */

/** 기본 모델. .env 로 덮어쓸 수 있습니다. */
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY 가 설정되지 않았습니다.");
    this.name = "MissingApiKeyError";
  }
}

let cached: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (cached) return cached;
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new MissingApiKeyError();
  }
  cached = new Anthropic({
    // SDK 기본 재시도(2회)에 더해, 개별 요청 타임아웃은 아래에서 지정합니다.
    maxRetries: 2,
    timeout: 120_000, // ms
  });
  return cached;
}

/**
 * Anthropic SDK / 일반 예외를 사용자에게 보여줄 ApiError 로 변환합니다.
 * 반드시 "구체적인 클래스 → 일반적인 클래스" 순으로 검사합니다.
 */
export function toApiError(err: unknown): ApiError {
  if (err instanceof MissingApiKeyError) {
    return {
      code: "MISSING_API_KEY",
      message: "Claude API 키가 설정되지 않았습니다.",
      hint: "프로젝트 루트의 .env.local 에 ANTHROPIC_API_KEY 를 입력한 뒤 개발 서버를 재시작하세요.",
    };
  }

  if (err instanceof Anthropic.AuthenticationError) {
    return {
      code: "MISSING_API_KEY",
      message: "Claude API 키가 유효하지 않습니다.",
      hint: "console.anthropic.com 에서 키를 다시 발급받아 .env.local 을 갱신하세요.",
    };
  }

  if (err instanceof Anthropic.RateLimitError) {
    return {
      code: "RATE_LIMITED",
      message: "요청이 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
      hint: "30초 정도 기다린 뒤 재시도하거나, 조직의 rate limit 을 확인하세요.",
    };
  }

  if (err instanceof Anthropic.BadRequestError) {
    return {
      code: "UPSTREAM_ERROR",
      message: `요청 형식 오류: ${err.message}`,
      hint: "입력값이 지나치게 길지 않은지 확인해 주세요.",
    };
  }

  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return {
      code: "TIMEOUT",
      message: "Claude API 응답이 지연되어 요청을 종료했습니다.",
      hint: "네트워크 상태를 확인하고 다시 시도해 주세요.",
    };
  }

  if (err instanceof Anthropic.APIConnectionError) {
    return {
      code: "UPSTREAM_ERROR",
      message: "Claude API 에 연결하지 못했습니다.",
      hint: "네트워크(사내 방화벽/프록시) 설정을 확인해 주세요.",
    };
  }

  if (err instanceof Anthropic.APIError) {
    return {
      code: "UPSTREAM_ERROR",
      message: `Claude API 오류 (${err.status ?? "unknown"}): ${err.message}`,
    };
  }

  if (err instanceof Error) {
    return { code: "UNKNOWN", message: err.message };
  }

  return { code: "UNKNOWN", message: "알 수 없는 오류가 발생했습니다." };
}

/**
 * refusal / max_tokens 등 "정상 응답이지만 결과를 쓸 수 없는" 경우를 걸러냅니다.
 * (Claude Opus 5 는 안전 분류기에 의해 stop_reason: "refusal" 로 끝날 수 있습니다.)
 *
 * @param allowTruncated 응답이 잘려도 이어서 쓸 수 있는 경우(예: 리서치 노트) true
 */
export function assertUsableStop(
  message: { stop_reason: string | null; stop_details?: unknown },
  allowTruncated = false,
): void {
  if (message.stop_reason === "refusal") {
    const details = message.stop_details as { category?: string | null } | null | undefined;
    throw Object.assign(
      new Error(`모델이 응답을 거부했습니다. (사유: ${details?.category ?? "unspecified"})`),
      { __apiCode: "UPSTREAM_ERROR" as const },
    );
  }
  if (message.stop_reason === "max_tokens" && !allowTruncated) {
    throw Object.assign(
      new Error("응답이 최대 길이에 도달해 잘렸습니다. 입력 내용을 줄이고 다시 시도해 주세요."),
      { __apiCode: "PARSE_FAILED" as const },
    );
  }
}
