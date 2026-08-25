import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { assertUsableStop, DEFAULT_MODEL, getAnthropicClient } from "@/lib/anthropic";
import { fail, normalizeError, ok, parseBody } from "@/lib/api";
import { STORY_COACH_SYSTEM, buildStoryPrompt } from "@/lib/prompts/story";
import { generateStoryInputSchema, storyPackageSchema } from "@/lib/schemas";
import type { StoryPackage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Step 3 — 기업 분석 결과 + 지원자 프로필을 교차 분석해 면접 스토리 패키지를 생성합니다.
 *
 * 산출물이 길기 때문에(자기소개·STAR 3개·지원동기·꼬리질문 3개) 스트리밍으로 받아
 * HTTP 타임아웃을 피하고, 마지막에 structured output 을 파싱합니다.
 */
export async function POST(request: Request) {
  const parsed = await parseBody(request, generateStoryInputSchema);
  if (!parsed.ok) return fail(parsed.error);

  const { companyIntel, candidate, sector } = parsed.data;

  try {
    const client = getAnthropicClient();

    const stream = client.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: 32000,
      system: STORY_COACH_SYSTEM,
      messages: [
        { role: "user", content: buildStoryPrompt({ companyIntel, candidate, sector }) },
      ],
      output_config: {
        effort: "high",
        format: zodOutputFormat(storyPackageSchema),
      },
    });

    const message = await stream.finalMessage();
    assertUsableStop(message);

    // 스트리밍 경로에서는 parsed_output 이 채워지지 않을 수 있으므로 직접 파싱합니다.
    const text = message.content
      .filter((block): block is { type: "text"; text: string; citations: null } =>
        block.type === "text",
      )
      .map((block) => block.text)
      .join("");

    const validated = storyPackageSchema.safeParse(safeJsonParse(text));
    if (!validated.success) {
      return fail({
        code: "PARSE_FAILED",
        message: "면접 스토리를 구조화하지 못했습니다.",
        hint: "입력한 경험 내용을 조금 줄이거나 다듬은 뒤 다시 시도해 주세요.",
      });
    }

    return ok(validated.data as StoryPackage);
  } catch (err) {
    return fail(normalizeError(err));
  }
}

/** 모델이 앞뒤에 설명을 붙였을 때를 대비한 관대한 JSON 파서 */
function safeJsonParse(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
