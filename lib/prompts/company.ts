import { SECTOR_MAP } from "@/lib/presets";
import type { TourismSector } from "@/lib/types";
import { currentYearMonth } from "@/lib/utils";

/**
 * Step 1 — 기업 분석 프롬프트 모듈.
 *
 * 2단계로 나눕니다.
 *  1) 리서치: 외부 검색 API 결과를 쓰거나, 없으면 Claude 내장 web_search 로 근거를 모읍니다.
 *  2) 구조화: 모은 근거만 가지고 CompanyIntel JSON 을 만듭니다. (structured outputs)
 *
 * 이렇게 분리하는 이유: 서버 도구(web_search)와 structured outputs 를 한 호출에 섞지 않기 위해서,
 * 그리고 "근거 → 구조화"를 분리해야 환각을 걸러내기 쉽기 때문입니다.
 */

export interface CompanyPromptContext {
  companyName: string;
  jobTitle: string;
  sector: TourismSector;
  extraContext: string;
}

/* ────────────────────────────────────────────────────────────
 * 공통 페르소나
 * ──────────────────────────────────────────────────────────── */

export const COMPANY_ANALYST_SYSTEM = `당신은 한국 관광 산업 채용을 15년간 다뤄 온 커리어 컨설턴트이자 산업 애널리스트입니다.
호텔·리조트, 여행사·OTA, 관광 공공기관·DMO, MICE, 항공 등 관광 생태계의 수익 구조와 채용 관행을 모두 알고 있습니다.

당신의 일은 지원자가 "홈페이지에 있는 말"이 아니라 "면접장에서 통하는 정보"를 갖게 하는 것입니다.

원칙:
1. 사실과 추론을 반드시 구분합니다. 근거에서 확인되지 않은 내용은 반드시 "(추정)"을 붙이고, 지어내지 않습니다.
2. 확인되지 않으면 빈 문자열 또는 빈 배열로 두는 것이, 그럴듯한 거짓을 쓰는 것보다 낫습니다.
3. 관광업 특유의 맥락(성수기/비수기, 인바운드·아웃바운드, 채널 의존도, 현장 인력 이직률, 정책 의존성)을 항상 고려합니다.
4. 대기업 일반론("고객 중심", "글로벌 인재")으로 도피하지 않고, 이 기업 고유의 현안을 짚습니다.
5. 출처 URL은 실제로 제공된 근거에 있는 것만 씁니다. URL을 창작하지 않습니다.`;

/* ────────────────────────────────────────────────────────────
 * 1) 리서치 단계 — Claude 내장 web_search 를 쓰는 경로
 * ──────────────────────────────────────────────────────────── */

export function buildNativeResearchPrompt(ctx: CompanyPromptContext): string {
  const preset = SECTOR_MAP[ctx.sector];

  return `아래 기업을 웹에서 조사해 주세요. 검색 도구를 적극적으로 사용하세요.

# 조사 대상
- 기업/기관명: ${ctx.companyName}
- 지원 직무: ${ctx.jobTitle}
- 업종 구분: ${preset.label}
- 업종 관점: ${preset.lens}
${ctx.extraContext ? `- 지원자가 제공한 참고 정보:\n${ctx.extraContext}` : ""}

# 반드시 찾아야 할 것
1. 공식 미션 / 비전 / 인재상 (채용 페이지, 지속가능경영보고서, 기관 소개 등)
2. 최근 1~2년(${new Date().getFullYear() - 1}~${new Date().getFullYear()}) 주요 사업 모델과 신규 전략
   - 특히 관광업 핵심 축: DX 전환, 로컬·지역관광 활성화, 인바운드/아웃바운드 전략, 신규 브랜드·채널
3. 최근 보도자료 / 이슈 / 행사 / 실적 (최신순, 날짜 포함)
4. ${ctx.jobTitle} 직무의 채용공고 자격요건과 우대사항

# 조사 방법
- ${preset.searchHints.map((h) => `"${ctx.companyName} ${h}"`).join(", ")} 같은 조합으로 검색하세요.
- 공식 홈페이지·보도자료·채용공고를 1순위 근거로, 언론 기사를 2순위로 봅니다.
- 찾은 내용마다 반드시 URL을 함께 기록하세요.

# 출력 형식
조사한 내용을 항목별로 정리한 **리서치 노트**를 작성하세요.
각 항목 끝에 [출처: 제목 - URL] 을 붙입니다.
찾지 못한 항목은 "확인되지 않음"이라고 명시하세요. 추측으로 채우지 마세요.
JSON이 아니라 읽기 쉬운 텍스트 노트로 작성합니다.`;
}

/* ────────────────────────────────────────────────────────────
 * 2) 구조화 단계 — 근거만 가지고 JSON 생성
 * ──────────────────────────────────────────────────────────── */

export function buildStructuringPrompt(
  ctx: CompanyPromptContext,
  evidence: string,
  evidenceSource: "external-search" | "native-search" | "none",
): string {
  const preset = SECTOR_MAP[ctx.sector];

  const sourceNote = {
    "external-search": "아래는 웹 검색 API로 수집한 실제 검색 결과입니다.",
    "native-search": "아래는 당신이 방금 웹 검색으로 조사해 정리한 리서치 노트입니다.",
    none:
      "웹 검색에 실패해 근거가 없습니다. 당신의 사전 지식만으로 작성하되, " +
      "confidence 는 반드시 \"low\" 로 하고 불확실한 항목마다 \"(추정)\"을 붙이세요. " +
      "sources 는 빈 배열로 두세요.",
  }[evidenceSource];

  return `${sourceNote}

# 분석 대상
- 기업/기관명: ${ctx.companyName}
- 지원 직무: ${ctx.jobTitle}
- 업종: ${preset.label}
- 이 업종을 볼 때의 관점: ${preset.lens}
- 오늘 기준 시점: ${currentYearMonth()}
${ctx.extraContext ? `\n# 지원자가 제공한 참고 정보\n${ctx.extraContext}` : ""}

# 근거 자료
${evidence}

# 작성 지침
- 위 근거에 없는 사실을 새로 만들지 마세요. 부족하면 "(추정)"을 붙이거나 비워 두세요.
- \`overview\`: "이 회사가 지금 무엇 때문에 사람을 뽑는가"가 드러나게 3~4문장으로 씁니다.
- \`identity.talentProfile\`: 인재상 키워드를 그대로 옮기지 말고, 그것이 면접에서 실제로 무엇을 검증하려는 것인지 해석을 덧붙이세요.
  (예: "도전" → "선례 없는 상품을 스스로 설계해 본 경험이 있는지 확인하려는 항목")
- \`business.newStrategies\`: 관광업 전략 축(DX 전환 / 로컬·지역관광 / 인바운드·아웃바운드 / 채널·브랜드 확장 / 지속가능관광) 중
  해당되는 것을 우선 배치하고, 각 전략이 왜 지금 나왔는지(시장 상황)를 함께 설명하세요.
- \`recentIssues\`: 최신순 4~6건. 각 건마다 \`interviewAngle\`에 "면접에서 이 이슈를 어떻게 꺼내면 좋은지"를 한 문장으로 쓰세요.
- \`interviewerKeywords\`: 채용 담당자가 ${ctx.jobTitle} 지원자에게 실제로 확인할 평가 항목 4~6개.
  각각 실제 나올 법한 질문 예시를 포함합니다.
- \`watchOuts\`: 지원자가 모르고 말하면 감점되는 지점(예: 최근 철수한 사업을 하고 싶다고 말하는 경우) 2~4개.
- \`sources\`: 근거 자료에 실제로 등장한 URL만 옮깁니다. URL이 없으면 빈 배열.
- \`confidence\`: 공식 자료 기반이면 high, 언론 기사 위주면 medium, 근거 없이 사전지식이면 low.
- 모든 문자열은 한국어로 작성합니다.`;
}
