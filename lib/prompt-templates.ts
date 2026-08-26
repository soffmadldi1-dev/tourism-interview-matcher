import { SECTOR_MAP, TONE_MAP } from "@/lib/presets";
import type { PromptContext } from "@/lib/types";

/**
 * 프롬프트 템플릿 모음.
 *
 * 이 앱은 AI를 직접 호출하지 않습니다. 대신 사용자가 그대로 복사해서
 * claude.ai 채팅창에 붙여넣을 수 있는 "완성된 프롬프트"를 만들어 줍니다.
 */

export type PromptStage = "analyze" | "document" | "interview";

export interface PromptTemplate {
  id: string;
  stage: PromptStage;
  order: number;
  title: string;
  /** 언제 쓰는 프롬프트인지 */
  when: string;
  /** 이 프롬프트를 쓰기 전에 채워야 하는 입력 */
  requires: { field: keyof PromptContext; label: string }[];
  /** 결과를 받은 뒤 무엇을 할지 */
  nextStep: string;
  build: (ctx: PromptContext) => string;
}

export const STAGE_META: Record<
  PromptStage,
  { label: string; short: string; description: string }
> = {
  analyze: {
    label: "1단계 · 기업 분석",
    short: "기업 분석",
    description: "직접 모은 자료를 AI에게 정리시켜 면접용 정보로 바꿉니다.",
  },
  document: {
    label: "2단계 · 서류 매칭",
    short: "서류 매칭",
    description: "분석 결과에 맞춰 이력서와 자기소개서를 이 회사용으로 고칩니다.",
  },
  interview: {
    label: "3단계 · 면접 준비",
    short: "면접 준비",
    description: "실제로 입 밖에 낼 스크립트와 예상 질문을 만듭니다.",
  },
};

/* ────────────────────────────────────────────────────────────
 * 공통 블록
 * ──────────────────────────────────────────────────────────── */

const PLACEHOLDER = {
  material: "[② 조사 자료 탭에 수집한 자료를 붙여넣으면 여기에 들어갑니다]",
  analysis: "[② 조사 자료 탭에 기업 분석 결과를 붙여넣으면 여기에 들어갑니다]",
  resume: "[③ 내 서류 탭에 이력서를 붙여넣으면 여기에 들어갑니다]",
  coverLetter: "[③ 내 서류 탭에 자기소개서를 붙여넣으면 여기에 들어갑니다]",
};

function fill(value: string, placeholder: string): string {
  return value.trim() ? value.trim() : placeholder;
}

function companyBlock(ctx: PromptContext): string {
  const preset = SECTOR_MAP[ctx.sector];
  return `# 지원 정보
- 기업/기관명: ${fill(ctx.companyName, "[기업명]")}
- 지원 직무: ${fill(ctx.jobTitle, "[직무명]")}
- 업종: ${preset.label}
- 이 업종을 볼 때의 관점: ${preset.lens}`;
}

function myDocumentsBlock(ctx: PromptContext): string {
  return `# 제 서류

## 이력서
${fill(ctx.resumeText, PLACEHOLDER.resume)}

## 자기소개서
${fill(ctx.coverLetterText, PLACEHOLDER.coverLetter)}`;
}

function toneBlock(ctx: PromptContext): string {
  const tone = TONE_MAP[ctx.tone];
  return `# 톤앤매너: ${tone.label} (${tone.short})
${tone.instruction}`;
}

const HONESTY_RULE = `# 반드시 지켜 주세요
- 제 서류에 없는 경험, 숫자, 성과를 지어내지 마세요. 이것이 가장 중요합니다.
- 구체적인 수치가 필요한데 제 서류에 없다면, 지어내지 말고 [실제 수치 기입]이라고 표시해 주세요.
- 자료에서 확인되지 않은 회사 정보는 "확인되지 않음"이라고 표시하세요.
- 답변 마지막에, 제가 사실 확인해야 할 부분을 따로 정리해 주세요.`;

/* ────────────────────────────────────────────────────────────
 * 템플릿
 * ──────────────────────────────────────────────────────────── */

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  /* ── 1단계 ─────────────────────────────────────────────── */
  {
    id: "company-analysis",
    stage: "analyze",
    order: 1,
    title: "기업 분석 리포트 만들기",
    when: "검색 링크로 자료를 모아 '② 조사 자료'에 붙여넣은 다음 사용하세요.",
    requires: [
      { field: "companyName", label: "기업명" },
      { field: "collectedMaterial", label: "수집한 자료" },
    ],
    nextStep:
      "받은 답변 전체를 복사해서 '② 조사 자료' 탭의 아래 칸에 붙여넣으세요. 2·3단계 프롬프트가 모두 열립니다.",
    build: (ctx) => `당신은 한국 관광 산업 채용을 15년간 다뤄 온 커리어 컨설턴트이자 산업 애널리스트입니다.
호텔·리조트, 여행사·OTA, 관광 공공기관, MICE, 항공 분야의 수익 구조와 채용 관행을 모두 알고 있습니다.

제가 직접 수집한 아래 자료를 읽고, 면접장에서 실제로 통하는 형태로 정리해 주세요.

${companyBlock(ctx)}

# 제가 수집한 자료
${fill(ctx.collectedMaterial, PLACEHOLDER.material)}

# 정리해 주실 내용

## 1. 한눈에 보기
이 회사가 지금 어떤 상황에 놓여 있고, 왜 지금 사람을 뽑는지 3~4문장으로.

## 2. 미션 · 비전 · 인재상
인재상은 문구를 그대로 옮기지 마세요. 각 키워드가 **면접에서 실제로 무엇을 검증하려는 항목인지** 해석을 붙여 주세요.
(예: "도전" → "선례 없는 상품을 스스로 설계해 본 경험이 있는지 확인하려는 항목")

## 3. 핵심 사업 모델과 최근 신규 전략
관광업의 전략 축 — DX 전환 / 로컬·지역관광 / 인바운드·아웃바운드 / 채널·브랜드 확장 / 지속가능관광 — 중
해당되는 것을 우선 배치하고, 각 전략이 **왜 지금 나왔는지**(시장 상황)를 함께 설명해 주세요.

## 4. 최근 이슈 · 행사 · 보도자료
최신순으로 정리하고, 각 항목마다 **"면접에서 이 이슈를 어떤 각도로 꺼내면 좋은지"**를 한 문장씩 붙여 주세요.

## 5. 면접관이 볼 핵심 평가 키워드 (4~6개)
${fill(ctx.jobTitle, "[직무]")} 지원자에게 실제로 확인할 항목을 뽑고,
각각 **실제 나올 법한 질문 예시**를 하나씩 포함해 주세요.

## 6. 말하기 전에 알아둬야 할 현안
모르고 말하면 감점되는 지점 (예: 최근 철수한 사업을 하고 싶다고 말하는 경우).

${HONESTY_RULE}

정리된 결과는 제가 다음 단계에서 그대로 복사해 쓸 예정이니, 깔끔하게 구조화해서 출력해 주세요.`,
  },

  /* ── 2단계 ─────────────────────────────────────────────── */
  {
    id: "resume-tailoring",
    stage: "document",
    order: 2,
    title: "이력서를 이 회사용으로 고치기",
    when: "기업 분석 결과와 이력서를 넣은 뒤 사용하세요.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep: "제안받은 순서와 표현으로 이력서를 수정한 뒤, 자기소개서 프롬프트로 넘어가세요.",
    build: (ctx) => `당신은 관광 산업 채용 서류를 심사해 온 인사 담당자입니다.
같은 이력이라도 **무엇을 앞에 두고 어떤 단어로 쓰느냐**에 따라 서류 통과 여부가 갈린다는 것을 알고 있습니다.

${companyBlock(ctx)}

# 기업 분석 결과
${fill(ctx.companyAnalysis, PLACEHOLDER.analysis)}

${myDocumentsBlock(ctx)}

# 요청

## 1. 우선순위 재배치
이 회사가 지금 필요로 하는 것 기준으로, 제 이력 중 **무엇을 맨 앞에 둬야 하는지** 순서를 다시 잡아 주세요.
각 항목마다 "왜 이 순서인지" 한 줄 이유를 붙여 주세요.

## 2. 표현 교체 (Before → After)
회사의 인재상·평가 키워드에 걸리도록 문장을 다시 써 주세요. 표 형태로:

| 현재 표현 | 수정 제안 | 왜 이렇게 바꾸는가 |

성과는 가능한 한 **숫자로** 바꿔 주세요. 제 이력서에 숫자가 없다면 [실제 수치 기입]으로 표시해 주세요.

## 3. 빼야 할 항목
이 회사·직무와 관련이 낮아 오히려 초점을 흐리는 항목이 있다면 지적해 주세요.

## 4. 비어 있는 칸
회사가 원하는데 제 이력서에 근거가 없는 항목을 알려 주세요.
그리고 그 공백을 **지금 당장 메울 수 있는 현실적인 방법**(자격증, 단기 프로젝트, 기존 경험 재해석)을 제안해 주세요.

${toneBlock(ctx)}

${HONESTY_RULE}`,
  },

  {
    id: "cover-letter",
    stage: "document",
    order: 3,
    title: "자기소개서를 이 회사용으로 고치기",
    when: "기업 분석 결과와 자기소개서를 넣은 뒤 사용하세요.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "coverLetterText", label: "자기소개서" },
    ],
    nextStep: "고쳐진 문장을 본인 말투로 다듬고, 수치와 사실을 반드시 검증하세요.",
    build: (ctx) => `당신은 관광 산업 취업 컨설턴트입니다.
"열정", "고객 감동" 같은 공허한 표현 대신 **행동과 결과**로 말하게 만드는 것이 당신의 강점입니다.

${companyBlock(ctx)}

# 기업 분석 결과
${fill(ctx.companyAnalysis, PLACEHOLDER.analysis)}

${myDocumentsBlock(ctx)}

# 요청

제 자기소개서를 **이 회사 전용으로** 다시 써 주세요.

## 사고 순서 (반드시 이 순서로)
1. 기업 분석 결과에서 **이 회사가 지금 필요로 하는 역량**을 먼저 뽑는다.
2. 제 자기소개서의 각 문항이 그중 무엇을 보여줄 수 있는지 판단한다.
3. 제 이력서의 경험 중 **가장 가까운 증거**를 배정한다. (같은 경험을 두 문항에 반복하지 말 것)
4. 그 다음에 문장을 고친다.

## 문항별 출력 형식
**[문항] 원문**
- **이 문항의 진짜 의도**: 면접관이 확인하려는 것 한 줄
- **현재 답변의 문제점**: 왜 이대로는 약한지
- **수정본**: 원래 글자 수에 맞춰 다시 작성
- **첫 문장 대안 2개**: 도입부는 읽히느냐 마느냐를 가르므로 선택지를 주세요

자기소개서에 문항 구분이 없으면, 내용 흐름에 따라 나눠서 정리해 주세요.

## 반드시 지킬 것
- 첫 문장에서 이 회사의 **구체적인 최근 전략이나 이슈**를 언급하세요. 일반론으로 시작하면 실패입니다.
- "어릴 적부터 관광에 관심이 많아" 류의 감정 서사를 쓰지 마세요.
- **회사 이름만 바꾸면 다른 회사에도 그대로 낼 수 있는 문장은 실패**입니다.

${toneBlock(ctx)}

${HONESTY_RULE}`,
  },

  /* ── 3단계 ─────────────────────────────────────────────── */
  {
    id: "one-minute-pitch",
    stage: "interview",
    order: 4,
    title: "1분 자기소개 스크립트 만들기",
    when: "면접 준비의 첫 단추입니다. 기업 분석 결과가 있어야 제대로 나옵니다.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep: "소리 내어 읽으며 시간을 재보세요. 60초를 넘으면 문장을 덜어내세요.",
    build: (ctx) => `당신은 관광 산업 면접 코치입니다. 면접관으로도 여러 차례 참여해 왔습니다.
글로 읽는 문장이 아니라 **입 밖으로 낼 수 있는 구어체**로 쓰는 것이 중요합니다.

${companyBlock(ctx)}

# 기업 분석 결과
${fill(ctx.companyAnalysis, PLACEHOLDER.analysis)}

${myDocumentsBlock(ctx)}

# 요청

## 1. 기업 니즈 ↔ 제 경험 매칭표
먼저 표로 정리해 주세요. 4~6행.

| 회사가 지금 필요로 하는 것 | 제 근거 경험 | 연결 강도 | 연결 논리 한 문장 |

연결 강도는 강함 / 보통 / **부족** 중 하나로 솔직하게 표시해 주세요.
**최소 1개는 '부족'으로 표시**하고, 그 공백을 어떻게 방어할지도 알려 주세요.

## 2. 1분 자기소개 스크립트
위 매칭표를 근거로 작성해 주세요.

- **구조**: [회사의 현재 상황 인식 한 문장] → [나를 규정하는 한 문장] → [근거 경험 1~2개] → [입사 후 무엇을 하겠다]
- **분량**: 350~420자 (말하면 55~70초)
- **첫 문장에 반드시** 이 회사의 구체적인 최근 전략이나 이슈를 넣어 주세요.
- 한 줄로 압축한 **캐치프레이즈**도 함께 제안해 주세요. (면접관이 저를 기억할 라벨)

## 3. 전달 팁 3가지
어디서 끊어 읽을지, 어느 단어를 강조할지, 어디서 눈을 맞출지.

${toneBlock(ctx)}

${HONESTY_RULE}`,
  },

  {
    id: "star-answers",
    stage: "interview",
    order: 5,
    title: "핵심 경험 STAR 답변 만들기",
    when: "경험 기반 질문에 대비할 때. 면접에서 가장 많이 나오는 유형입니다.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep: "소리 내어 연습하고, [실제 수치 기입] 부분을 본인 데이터로 채우세요.",
    build: (ctx) => `당신은 관광 산업 면접 코치입니다.
평범해 보이는 경험에서 **"이 회사가 지금 필요로 하는 증거"**를 찾아내는 것이 당신의 강점입니다.

${companyBlock(ctx)}

# 기업 분석 결과
${fill(ctx.companyAnalysis, PLACEHOLDER.analysis)}

${myDocumentsBlock(ctx)}

# 요청

이 회사에서 나올 법한 **경험 기반 질문 3개**를 뽑고, 각각 STAR 기법으로 답변을 만들어 주세요.

## 조건
- 세 답변은 **각각 다른 현안**과 연결되어야 합니다. 같은 경험을 두 번 쓰지 마세요.
- 질문은 이 회사의 실제 사업·이슈에서 파생된 것이어야 합니다. 일반적인 질문 말고요.

## 각 답변의 형식
**Q. (실제 나올 법한 질문)**
- **기업 연결점**: 이 답변이 회사의 어떤 현안과 닿는지
- **S (상황)**: 1~2문장으로 짧게
- **T (과제)**: 1~2문장으로 짧게
- **A (행동)**: 3~4문장. 제가 한 행동을 **구체적인 동사**로. 여기가 가장 중요합니다.
- **R (결과)**: 숫자 우선. 제 서류에 숫자가 없으면 [실제 수치 기입]으로 표시
- **마무리 연결**: "이 경험이 ${fill(ctx.companyName, "[기업명]")}의 ○○ 상황에서 이렇게 쓰입니다" 형태의 한 문장

## 관광업 면접의 현실을 반영해 주세요
현장 대응력, 교대·성수기 근무 감내, 컴플레인 처리, 외국어, 채널·수익 감각 — 이런 것들이 실제로 평가됩니다.

${toneBlock(ctx)}

${HONESTY_RULE}`,
  },

  {
    id: "follow-up-defense",
    stage: "interview",
    order: 6,
    title: "압박 꼬리질문 방어 논리 만들기",
    when: "면접 전날 마지막 점검용. 가장 아픈 곳을 미리 찔러보는 프롬프트입니다.",
    requires: [{ field: "resumeText", label: "이력서" }],
    nextStep: "답변을 외우지 말고 논리 구조만 기억하세요. 실제 질문은 조금씩 다릅니다.",
    build: (ctx) => `당신은 깐깐한 면접관입니다. 지원자를 배려하지 말고, 실제 면접장에서처럼 약점을 정확히 찔러 주세요.

${companyBlock(ctx)}

# 기업 분석 결과
${fill(ctx.companyAnalysis, PLACEHOLDER.analysis)}

${myDocumentsBlock(ctx)}

# 요청

## 1. 제 서류의 약점 진단
먼저 제 이력서·자기소개서에서 면접관이 **파고들 만한 지점**을 냉정하게 짚어 주세요.
(경력 공백, 직무 전환, 짧은 근속, 관광업 밖 경력, 경험 부족, 지원 동기의 빈약함 등)

## 2. 압박 꼬리질문 5개와 방어 논리
듣기 좋은 질문 말고 **실제 압박 질문**으로 만들어 주세요.

각 질문마다:
- **Q**: 질문 원문
- **면접관의 의도**: 이 질문으로 확인하려는 것
- **방어 논리 요지**: 한 문장
- **답변 예시**: 150~250자. **인정 → 재해석 → 대안 근거** 구조로
- **하면 안 되는 답변**: 흔히 하는 실수 한 줄

## 3. 역질문 3개
면접 마지막에 "질문 있으신가요?"를 들었을 때, 이 회사의 실제 현안을 알고 있다는 걸 드러낼 수 있는 질문을 만들어 주세요.
연봉·복지 질문은 빼고, **회사의 최근 전략에 대한 질문**으로요.

${toneBlock(ctx)}

${HONESTY_RULE}`,
  },
];

export function templatesByStage(stage: PromptStage): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((template) => template.stage === stage).sort(
    (a, b) => a.order - b.order,
  );
}

/** 프롬프트를 쓸 준비가 됐는지 (필수 입력이 채워졌는지) */
export function missingFields(template: PromptTemplate, ctx: PromptContext): string[] {
  return template.requires
    .filter((requirement) => {
      const value = ctx[requirement.field];
      if (Array.isArray(value)) return value.length === 0;
      return !String(value ?? "").trim();
    })
    .map((requirement) => requirement.label);
}

/**
 * 수업에서 만든 서류를 Claude 채팅 기록에서 꺼내올 때 쓰는 짧은 프롬프트.
 * 예전 대화창에 그대로 붙여넣으면 최종본만 다시 출력됩니다.
 */
export const RECALL_PROMPT = `우리가 이 대화에서 함께 완성한 이력서와 자기소개서의 **최종본 전체**를
설명이나 요약 없이 본문 그대로 다시 출력해 줘.
자기소개서는 문항과 답변을 함께 보여 줘.`;
