import type { SearchHit, SearchProvider, TourismSector } from "@/lib/types";
import { SECTOR_MAP } from "@/lib/presets";
import { withTimeout } from "@/lib/utils";

/**
 * 실시간 웹 검색 레이어.
 *
 * 우선순위: Tavily → Serper(Google) → Perplexity → Claude 내장 web_search → 사전지식
 * 앞 순위가 키 미설정/실패면 자동으로 다음 순위로 폴백하고, 어떤 경로를 탔는지 메타로 돌려줍니다.
 */

const SEARCH_TIMEOUT_MS = 15_000;
const MAX_HITS_PER_QUERY = 6;
const MAX_TOTAL_HITS = 20;

export interface RetrievalResult {
  hits: SearchHit[];
  provider: SearchProvider;
  queries: string[];
  fallbackUsed: boolean;
  notice: string;
}

/* ────────────────────────────────────────────────────────────
 * 검색 쿼리 설계 (관광업 특화)
 * ──────────────────────────────────────────────────────────── */

export function buildQueries(
  companyName: string,
  jobTitle: string,
  sector: TourismSector,
): string[] {
  const hints = SECTOR_MAP[sector]?.searchHints ?? [];
  const thisYear = new Date().getFullYear();

  return [
    `${companyName} 인재상 미션 비전 채용`,
    `${companyName} ${thisYear} ${thisYear - 1} 신규 사업 전략 ${hints.slice(0, 2).join(" ")}`,
    `${companyName} 보도자료 최근 이슈 발표`,
    `${companyName} ${jobTitle} 직무 채용공고 자격요건`,
  ];
}

/* ────────────────────────────────────────────────────────────
 * 공급자별 구현
 * ──────────────────────────────────────────────────────────── */

async function searchTavily(query: string, apiKey: string): Promise<SearchHit[]> {
  const res = await withTimeout(
    (signal) =>
      fetch("https://api.tavily.com/search", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          api_key: apiKey, // 구버전 호환
          query,
          search_depth: "advanced",
          max_results: MAX_HITS_PER_QUERY,
          include_answer: false,
          topic: "general",
        }),
      }),
    SEARCH_TIMEOUT_MS,
  );

  if (!res.ok) throw new Error(`Tavily ${res.status}: ${await safeText(res)}`);

  const json = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string; published_date?: string }[];
  };

  return (json.results ?? [])
    .filter((r) => r.url)
    .map((r) => ({
      title: r.title?.trim() || r.url!,
      url: r.url!,
      content: (r.content ?? "").slice(0, 1200),
      publishedAt: r.published_date,
    }));
}

async function searchSerper(query: string, apiKey: string): Promise<SearchHit[]> {
  const res = await withTimeout(
    (signal) =>
      fetch("https://google.serper.dev/search", {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
        body: JSON.stringify({ q: query, gl: "kr", hl: "ko", num: MAX_HITS_PER_QUERY }),
      }),
    SEARCH_TIMEOUT_MS,
  );

  if (!res.ok) throw new Error(`Serper ${res.status}: ${await safeText(res)}`);

  const json = (await res.json()) as {
    organic?: { title?: string; link?: string; snippet?: string; date?: string }[];
    news?: { title?: string; link?: string; snippet?: string; date?: string }[];
  };

  return [...(json.organic ?? []), ...(json.news ?? [])]
    .filter((r) => r.link)
    .map((r) => ({
      title: r.title?.trim() || r.link!,
      url: r.link!,
      content: (r.snippet ?? "").slice(0, 1200),
      publishedAt: r.date,
    }));
}

async function searchPerplexity(query: string, apiKey: string): Promise<SearchHit[]> {
  const res = await withTimeout(
    (signal) =>
      fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "한국 관광 산업 리서처. 사실만, 출처가 확인되는 내용만 간결히 정리한다.",
            },
            { role: "user", content: query },
          ],
          max_tokens: 900,
        }),
      }),
    SEARCH_TIMEOUT_MS,
  );

  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${await safeText(res)}`);

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    citations?: string[];
  };

  const answer = json.choices?.[0]?.message?.content?.trim() ?? "";
  const citations = json.citations ?? [];
  const hits: SearchHit[] = [];

  if (answer) {
    hits.push({
      title: `Perplexity 요약: ${query}`,
      url: citations[0] ?? "",
      content: answer.slice(0, 2000),
    });
  }
  for (const url of citations.slice(0, MAX_HITS_PER_QUERY)) {
    hits.push({ title: url, url, content: "" });
  }
  return hits;
}

/* ────────────────────────────────────────────────────────────
 * 폴백 체인
 * ──────────────────────────────────────────────────────────── */

type ProviderRunner = (query: string) => Promise<SearchHit[]>;
type ExternalProvider = Exclude<SearchProvider, "native" | "none">;

function resolveProviders(): { name: ExternalProvider; run: ProviderRunner }[] {
  const forced = (process.env.SEARCH_PROVIDER ?? "auto").trim().toLowerCase();
  const tavily = process.env.TAVILY_API_KEY?.trim();
  const serper = process.env.SERPER_API_KEY?.trim();
  const perplexity = process.env.PERPLEXITY_API_KEY?.trim();

  const all = [
    tavily && { name: "tavily" as const, run: (q: string) => searchTavily(q, tavily) },
    serper && { name: "serper" as const, run: (q: string) => searchSerper(q, serper) },
    perplexity && {
      name: "perplexity" as const,
      run: (q: string) => searchPerplexity(q, perplexity),
    },
  ].filter(Boolean) as { name: ExternalProvider; run: ProviderRunner }[];

  if (forced === "native") return [];
  if (forced !== "auto") return all.filter((p) => p.name === forced);
  return all;
}

/** 외부 검색 API 로 근거 수집. 모두 실패하면 provider: "none" 으로 돌려줍니다. */
export async function retrieveEvidence(
  companyName: string,
  jobTitle: string,
  sector: TourismSector,
): Promise<RetrievalResult> {
  const queries = buildQueries(companyName, jobTitle, sector);
  const providers = resolveProviders();
  const failures: string[] = [];

  for (const provider of providers) {
    try {
      const settled = await Promise.allSettled(queries.map((q) => provider.run(q)));
      const hits = dedupe(
        settled.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
      ).slice(0, MAX_TOTAL_HITS);

      if (hits.length === 0) {
        failures.push(`${provider.name}: 결과 0건`);
        continue;
      }

      const partial = settled.some((r) => r.status === "rejected");
      return {
        hits,
        provider: provider.name,
        queries,
        fallbackUsed: provider.name !== providers[0].name,
        notice: partial
          ? `${provider.name} 검색 중 일부 쿼리가 실패해 남은 결과로 분석했습니다.`
          : "",
      };
    } catch (err) {
      failures.push(`${provider.name}: ${(err as Error).message}`);
    }
  }

  return {
    hits: [],
    provider: "none",
    queries,
    fallbackUsed: providers.length > 0,
    notice:
      providers.length === 0
        ? "외부 검색 API 키가 없어 Claude 내장 웹검색으로 진행합니다."
        : `외부 검색에 실패했습니다 (${failures.join(" / ")}). Claude 내장 웹검색으로 진행합니다.`,
  };
}

/* ────────────────────────────────────────────────────────────
 * 유틸
 * ──────────────────────────────────────────────────────────── */

function dedupe(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const hit of hits) {
    const key = hit.url || hit.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "(응답 본문 없음)";
  }
}

/** LLM 프롬프트에 넣을 검색 근거 블록 */
export function formatEvidence(hits: SearchHit[]): string {
  if (hits.length === 0) return "(수집된 검색 결과 없음)";
  return hits
    .map(
      (hit, i) =>
        `[${i + 1}] ${hit.title}\nURL: ${hit.url || "(없음)"}${
          hit.publishedAt ? `\n발행일: ${hit.publishedAt}` : ""
        }\n발췌: ${hit.content || "(발췌 없음)"}`,
    )
    .join("\n\n");
}
