import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { assertUsableStop, DEFAULT_MODEL, getAnthropicClient } from "@/lib/anthropic";
import { fail, normalizeError, ok, parseBody } from "@/lib/api";
import {
  COMPANY_ANALYST_SYSTEM,
  buildNativeResearchPrompt,
  buildStructuringPrompt,
  type CompanyPromptContext,
} from "@/lib/prompts/company";
import { companyIntelCoreSchema, companySearchInputSchema } from "@/lib/schemas";
import { formatEvidence, retrieveEvidence } from "@/lib/search";
import type { CompanyIntel, RetrievalMeta, SearchProvider } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Claude 내장 web_search 서버 도구 (Opus 5 / Sonnet 5 / 4.6+ 계열에서 사용 가능) */
const WEB_SEARCH_TOOL = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 8,
} as unknown as Anthropic.ToolUnion;

/** pause_turn 재개 최대 횟수 */
const MAX_RESUMES = 3;

export async function POST(request: Request) {
  const parsed = await parseBody(request, companySearchInputSchema);
  if (!parsed.ok) return fail(parsed.error);

  const ctx: CompanyPromptContext = parsed.data;

  try {
    const client = getAnthropicClient();

    /* ── 1) 근거 수집 ─────────────────────────────────────── */
    const retrieval = await retrieveEvidence(ctx.companyName, ctx.jobTitle, ctx.sector);

    let evidence = "";
    let evidenceSource: "external-search" | "native-search" | "none";
    let provider: SearchProvider = retrieval.provider;
    let notice = retrieval.notice;
    let resultCount = retrieval.hits.length;

    if (retrieval.provider !== "none") {
      evidence = formatEvidence(retrieval.hits);
      evidenceSource = "external-search";
    } else {
      // 외부 검색 API가 없거나 실패 → Claude 내장 web_search 로 재시도
      try {
        const brief = await runNativeResearch(client, ctx);
        if (brief.trim().length < 80) throw new Error("내장 웹검색 결과가 비어 있습니다.");
        evidence = brief;
        evidenceSource = "native-search";
        provider = "native";
        resultCount = brief.split(/https?:\/\//).length - 1;
      } catch (searchErr) {
        // 그래도 실패 → 사전지식 폴백 (에러로 끝내지 않고 낮은 신뢰도로 계속 진행)
        evidence = "(수집된 근거 없음)";
        evidenceSource = "none";
        provider = "none";
        resultCount = 0;
        notice = [
          notice,
          `Claude 내장 웹검색도 사용하지 못했습니다 (${(searchErr as Error).message}).`,
          "검색 근거 없이 모델의 사전 지식만으로 작성되었으니 반드시 공식 홈페이지에서 교차 확인하세요.",
        ]
          .filter(Boolean)
          .join(" ");
      }
    }

    /* ── 2) 구조화 ────────────────────────────────────────── */
    const structured = await client.messages.parse({
      model: DEFAULT_MODEL,
      max_tokens: 16000,
      system: COMPANY_ANALYST_SYSTEM,
      messages: [
        { role: "user", content: buildStructuringPrompt(ctx, evidence, evidenceSource) },
      ],
      output_config: { format: zodOutputFormat(companyIntelCoreSchema) },
    });

    assertUsableStop(structured);

    if (!structured.parsed_output) {
      return fail({
        code: "PARSE_FAILED",
        message: "기업 분석 결과를 구조화하지 못했습니다.",
        hint: "잠시 후 다시 시도하거나, 기업명을 더 정확히 입력해 보세요.",
      });
    }

    const meta: RetrievalMeta = {
      provider,
      queries: retrieval.queries,
      resultCount,
      fallbackUsed: retrieval.fallbackUsed || provider !== retrieval.provider,
      notice,
    };

    const result: CompanyIntel = {
      ...structured.parsed_output,
      sector: ctx.sector,
      retrieval: meta,
    };

    return ok(result);
  } catch (err) {
    return fail(normalizeError(err));
  }
}

/* ────────────────────────────────────────────────────────────
 * Claude 내장 web_search 로 리서치 노트를 만듭니다.
 * 서버 도구는 stop_reason: "pause_turn" 으로 중단될 수 있으므로 직접 재개합니다.
 * ──────────────────────────────────────────────────────────── */
async function runNativeResearch(
  client: Anthropic,
  ctx: CompanyPromptContext,
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildNativeResearchPrompt(ctx) },
  ];
  const chunks: string[] = [];

  for (let attempt = 0; attempt <= MAX_RESUMES; attempt += 1) {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 12000,
      system: COMPANY_ANALYST_SYSTEM,
      tools: [WEB_SEARCH_TOOL],
      messages,
    });

    assertUsableStop(response, true);

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) chunks.push(block.text);
    }

    if (response.stop_reason !== "pause_turn") break;

    // 서버 도구가 반복 한도에 걸려 일시정지 — 어시스턴트 턴을 되돌려 넣고 이어서 진행
    messages.push({ role: "assistant", content: response.content });
  }

  return chunks.join("\n\n");
}
