import { SECTOR_MAP, TONE_MAP } from "@/lib/presets";
import { HTML_OUTPUT_RULES, SAVE_GUIDE } from "@/lib/html-spec";
import type { PromptContext } from "@/lib/types";

/**
 * 프롬프트 템플릿 모음.
 *
 * 이 앱은 AI를 직접 호출하지 않습니다. 대신 사용자가 그대로 복사해서
 * claude.ai 채팅창에 붙여넣을 수 있는 "완성된 프롬프트"를 만들어 줍니다.
 *
 * 2·3단계 프롬프트는 조언이 아니라 **완성된 HTML 문서**를 산출물로 요구합니다.
 * (수업 교안과 같은 형식이라, 받은 즉시 저장해서 제출·활용할 수 있습니다)
 */

export type PromptStage = "analyze" | "document" | "interview";

export interface PromptTemplate {
  id: string;
  stage: PromptStage;
  order: number;
  title: string;
  /** 산출물이 HTML 파일인 프롬프트 */
  producesHtml?: boolean;
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
    description:
      "분석 결과에 맞춰 고친 이력서·자기소개서를 완성된 HTML 파일로 받습니다.",
  },
  interview: {
    label: "3단계 · 면접 준비",
    short: "면접 준비",
    description:
      "1분 자기소개·STAR 답변·예상 질문을 인쇄 가능한 HTML 파일로 받습니다.",
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
  return `# 제 서류 (수업에서 만든 원본)

## 이력서
${fill(ctx.resumeText, PLACEHOLDER.resume)}

## 자기소개서
${fill(ctx.coverLetterText, PLACEHOLDER.coverLetter)}`;
}

function analysisBlock(ctx: PromptContext): string {
  return `# 기업 분석 결과
${fill(ctx.companyAnalysis, PLACEHOLDER.analysis)}`;
}

function toneBlock(ctx: PromptContext): string {
  const tone = TONE_MAP[ctx.tone];
  return `# 톤앤매너: ${tone.label} (${tone.short})
${tone.instruction}`;
}

const HONESTY_RULE = `# 반드시 지켜 주세요
- 제 서류에 없는 경험, 숫자, 성과를 **지어내지 마세요.** 이것이 가장 중요합니다.
- 수치가 필요한데 제 서류에 없다면 지어내지 말고 \`[실제 수치 기입]\`이라고 그대로 써 주세요.
- 자료에서 확인되지 않은 회사 정보는 쓰지 마세요.
- HTML 코드 블록이 끝난 뒤, **제가 직접 확인·수정해야 할 지점**을 목록으로 정리해 주세요.`;

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

# 반드시 지켜 주세요
- 위 자료에서 확인되지 않은 내용은 지어내지 말고 "확인되지 않음"이라고 표시하세요.
- 정리된 결과는 제가 다음 단계에서 그대로 복사해 쓸 예정이니, 깔끔하게 구조화해서 출력해 주세요.`,
  },

  /* ── 2단계 ─────────────────────────────────────────────── */
  {
    id: "resume-html",
    stage: "document",
    order: 2,
    producesHtml: true,
    title: "이 회사용 이력서 HTML 만들기",
    when: "기업 분석 결과와 이력서를 넣은 뒤 사용하세요. 완성된 이력서 파일이 나옵니다.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep: SAVE_GUIDE,
    build: (ctx) => `당신은 관광 산업 채용 서류를 심사해 온 인사 담당자이자, 실무에 바로 쓰는 문서를 만드는 편집자입니다.

제 이력서를 이 회사에 맞게 고쳐서, **바로 제출할 수 있는 완성된 이력서 HTML 파일**로 만들어 주세요.

${companyBlock(ctx)}

${analysisBlock(ctx)}

${myDocumentsBlock(ctx)}

# 이력서를 고치는 원칙

1. **우선순위 재배치** — 이 회사가 지금 필요로 하는 것 기준으로, 강한 경력·경험을 위로 올리세요.
2. **표현 교체** — 회사의 인재상·평가 키워드에 걸리도록 문장을 다시 쓰세요.
   (예: "행사 운영 보조" → "연 12회 국제행사 등록·현장 운영, 참가자 1,200명 응대")
3. **성과는 숫자로** — 제 이력서에 숫자가 있으면 반드시 살리고, 없으면 \`[실제 수치 기입]\`으로 표시하세요.
4. **관련 낮은 항목은 축소** — 이 직무와 무관한 내용은 짧게 줄이거나 뒤로 보내세요.
5. 없는 경력을 만들지 마세요. **순서와 표현만 바꾸는 것**입니다.

# HTML 문서 구성

\`.page\` 안에 아래 순서로 넣어 주세요. (내용이 넘치면 \`.page\`를 하나 더 추가)

- 머리말: \`.doc-eyebrow\`("RESUME · 이력서"), \`.doc-title\`(제 이름), \`.doc-headline\`
  → headline은 **이 회사가 원하는 사람으로 나를 규정하는 한 줄**로 쓰세요. 일반적인 소개 문구는 실패입니다.
- \`<hr class="rule">\`
- \`01 기본정보\` — \`.kv\` 사용 (제 이력서에 있는 항목만. 없으면 \`[기입]\` 표시)
- \`02 핵심 역량 (3줄 요약)\` — \`.three\` 사용. **이 회사 기준으로** 전문분야 / 대표성과 / 차별강점
- \`03 자기소개\` — \`.intro\` 사용. 4~6문장. 첫 문장에 이 회사의 구체적 현안을 넣으세요.
- \`04 경력 / 05 학력 / 06 자격 및 어학 / 07 기타 활동\` — \`.job\` \`.job-top\` \`.job-name\` \`.job-date\` \`.job-desc\` 또는 \`ul.list\` 사용
- 맨 아래 \`.foot\` — 왼쪽에 제 이름과 지원 직무, 오른쪽에 작성일

# HTML 코드 블록이 끝난 뒤에 덧붙일 것

## 무엇을 왜 바꿨는가
| 원래 표현 | 바꾼 표현 | 이유 |
표 형태로 5~8행.

## 비어 있는 칸
회사가 원하는데 제 이력서에 근거가 없는 항목과, 지금 당장 메울 수 있는 현실적인 방법.

${toneBlock(ctx)}

${HONESTY_RULE}

${HTML_OUTPUT_RULES}`,
  },

  {
    id: "cover-letter-html",
    stage: "document",
    order: 3,
    producesHtml: true,
    title: "이 회사용 자기소개서 HTML 만들기",
    when: "기업 분석 결과와 자기소개서를 넣은 뒤 사용하세요. 완성된 자소서 파일이 나옵니다.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "coverLetterText", label: "자기소개서" },
    ],
    nextStep: SAVE_GUIDE,
    build: (ctx) => `당신은 관광 산업 취업 컨설턴트입니다.
"열정", "고객 감동" 같은 공허한 표현 대신 **행동과 결과**로 말하게 만드는 것이 당신의 강점입니다.

제 자기소개서를 이 회사 전용으로 다시 써서, **바로 제출할 수 있는 완성된 자기소개서 HTML 파일**로 만들어 주세요.

${companyBlock(ctx)}

${analysisBlock(ctx)}

${myDocumentsBlock(ctx)}

# 다시 쓰는 원칙 (반드시 이 순서로 사고)

1. 기업 분석 결과에서 **이 회사가 지금 필요로 하는 역량**을 먼저 뽑는다.
2. 제 자기소개서의 각 문항이 그중 무엇을 보여줄 수 있는지 판단한다.
3. 제 이력서의 경험 중 **가장 가까운 증거**를 배정한다. (같은 경험을 두 문항에 반복하지 말 것)
4. 그 다음에 문장을 고친다.

## 반드시 지킬 것
- 각 문항 첫 문장에서 이 회사의 **구체적인 최근 전략이나 이슈**를 언급하세요.
- "어릴 적부터 관광에 관심이 많아" 류의 감정 서사를 쓰지 마세요.
- **회사 이름만 바꾸면 다른 회사에도 낼 수 있는 문장은 실패**입니다.
- 원본의 글자 수를 유지하세요. (문항에 글자 수 제한이 있으면 그 ±5% 이내)

# HTML 문서 구성

\`.page\` 안에:

- 머리말: \`.doc-eyebrow\`("COVER LETTER · 자기소개서"), \`.doc-title\`("자기소개서"),
  \`.doc-headline\`(지원 직무 / 제 이름)
- \`<hr class="rule">\`
- 문항마다 \`.qa\` 블록:
  - \`.qa-q\` — 문항 번호와 제목 (예: "Q1. 지원 동기")
  - \`.qa-h\` — **답변을 한 줄로 압축한 소제목.** 심사자가 이 줄만 읽어도 내용이 그려져야 합니다.
  - \`.qa-body\` — 답변 본문
  - \`.qa-count\` — 글자 수 (예: "402자")
  - 문항 사이에 \`<hr class="rule-soft">\`
- 원본에 문항 구분이 없으면 내용 흐름에 따라 4개 문항으로 나누세요
  (지원 동기 / 핵심 경험·역량 / 직무 적합성 / 입사 후 포부).
- 맨 아래 \`.foot\`

# HTML 코드 블록이 끝난 뒤에 덧붙일 것

## 문항별 변경 요지
문항마다 3줄로: **이 문항의 진짜 의도** / **배정한 제 경험** / **무엇을 바꿨는지**

## 첫 문장 대안
각 문항의 도입부 대안을 하나씩 더 제안해 주세요. 도입부가 읽히느냐 마느냐를 가릅니다.

${toneBlock(ctx)}

${HONESTY_RULE}

${HTML_OUTPUT_RULES}`,
  },

  /* ── 3단계 ─────────────────────────────────────────────── */
  {
    id: "pitch-html",
    stage: "interview",
    order: 4,
    producesHtml: true,
    title: "1분 자기소개 + 매칭표 HTML 만들기",
    when: "면접 준비의 첫 단추입니다. 소리 내어 연습할 스크립트가 나옵니다.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep: SAVE_GUIDE + " 저장한 뒤 소리 내어 읽으며 시간을 재보세요.",
    build: (ctx) => `당신은 관광 산업 면접 코치입니다. 면접관으로도 여러 차례 참여해 왔습니다.
글로 읽는 문장이 아니라 **입 밖으로 낼 수 있는 구어체**로 쓰는 것이 중요합니다.

면접 전에 보고 연습할 수 있는 **완성된 HTML 파일**로 만들어 주세요.

${companyBlock(ctx)}

${analysisBlock(ctx)}

${myDocumentsBlock(ctx)}

# HTML 문서 구성

\`.page\` 안에:

- 머리말: \`.doc-eyebrow\`("INTERVIEW · 1분 자기소개"), \`.doc-title\`(회사명 + 직무),
  \`.doc-headline\`(제 이름과 면접일 자리)
- \`<hr class="rule">\`

## 섹션 1 — 핵심 지표 (\`.stat-row\`)
\`.stat\` 3~4개로 제 강점을 숫자로 보여주세요. (경력 개월 수, 응대 건수, 프로젝트 수 등
**제 이력서에 실제로 있는 숫자만**. 없으면 이 섹션은 빼세요)

## 섹션 2 — 기업 니즈 ↔ 제 경험 매칭 (\`table.tbl\`)
4~6행. 열은: 회사가 필요로 하는 것 | 제 근거 경험 | 연결 강도 | 연결 논리
연결 강도는 \`<span class="tag ok">강함</span>\` / \`<span class="tag mid">보통</span>\` /
\`<span class="tag gap">부족</span>\` 중 하나로 **정직하게** 표시하세요.
**최소 1개는 '부족'으로** 표시하고, 그 행의 연결 논리에 방어 방법을 쓰세요.

## 섹션 3 — 1분 자기소개 스크립트 (\`.script\`)
- 구조: [회사의 현재 상황 인식 한 문장] → [나를 규정하는 한 문장] → [근거 경험 1~2개] → [입사 후 무엇을 하겠다]
- 350~420자 (말하면 55~70초)
- **첫 문장에 반드시** 이 회사의 구체적인 최근 전략이나 이슈를 넣으세요.
- 강조해서 말할 단어는 \`<b>\`로 감싸세요. (형광펜 효과가 들어갑니다)
- 스크립트 위에 \`.card-meta\`로 예상 소요 시간과 글자 수를 표시하세요.

## 섹션 4 — 캐치프레이즈 (\`.chips\`)
면접관이 저를 기억할 한 줄 라벨 3개를 \`.chip.accent\`로 제안해 주세요.

## 섹션 5 — 전달 팁 (\`ul.list\`)
어디서 끊어 읽을지, 어느 단어를 강조할지, 시선 처리 3~4개.

- 맨 아래 \`.foot\`

${toneBlock(ctx)}

${HONESTY_RULE}

${HTML_OUTPUT_RULES}`,
  },

  {
    id: "star-html",
    stage: "interview",
    order: 5,
    producesHtml: true,
    title: "핵심 경험 STAR 답변 HTML 만들기",
    when: "경험 기반 질문 대비용. 면접에서 가장 많이 나오는 유형입니다.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep: SAVE_GUIDE + " [실제 수치 기입] 부분은 본인 데이터로 채우세요.",
    build: (ctx) => `당신은 관광 산업 면접 코치입니다.
평범해 보이는 경험에서 **"이 회사가 지금 필요로 하는 증거"**를 찾아내는 것이 당신의 강점입니다.

면접 전에 보고 연습할 수 있는 **완성된 HTML 파일**로 만들어 주세요.

${companyBlock(ctx)}

${analysisBlock(ctx)}

${myDocumentsBlock(ctx)}

# 내용 조건

- 이 회사에서 나올 법한 **경험 기반 질문 4개**를 뽑으세요.
- 네 답변은 **각각 다른 현안**과 연결되어야 합니다. 같은 경험을 두 번 쓰지 마세요.
- 질문은 이 회사의 실제 사업·이슈에서 파생된 것이어야 합니다. 일반적인 질문 말고요.
- 관광업 면접의 현실을 반영하세요 — 현장 대응력, 교대·성수기 근무, 컴플레인 처리, 외국어, 채널·수익 감각.

# HTML 문서 구성

\`.page\` 안에:

- 머리말: \`.doc-eyebrow\`("INTERVIEW · 핵심 경험 STAR"), \`.doc-title\`(회사명 + 직무), \`.doc-headline\`
- \`<hr class="rule">\`
- 질문 4개를 각각 \`.sec\`으로:
  - \`.sec-h\` — \`<span class="n">Q1</span>\` + 질문 원문
  - \`.card-meta\` — "기업 연결점 · (이 답변이 회사의 어떤 현안과 닿는지)"
  - \`.star\` 블록 4개 — \`.star-k\`에 각각 S / T / A / R, \`.star-v\`에 내용
    - S(상황), T(과제)는 1~2문장으로 짧게
    - **A(행동)는 3~4문장, 구체적인 동사로.** 여기가 가장 중요합니다.
    - R(결과)는 숫자 우선. 없으면 \`[실제 수치 기입]\`
  - \`.warn\` — "마무리 연결: 이 경험이 ${fill(ctx.companyName, "[기업명]")}의 ○○ 상황에서 이렇게 쓰입니다" 한 문장
- 맨 아래 \`.foot\`

${toneBlock(ctx)}

${HONESTY_RULE}

${HTML_OUTPUT_RULES}`,
  },

  {
    id: "followup-html",
    stage: "interview",
    order: 6,
    producesHtml: true,
    title: "예상 질문 10개 + 압박 방어 논리 HTML 만들기",
    when: "면접 전날 마지막 점검용. 가장 아픈 곳을 미리 찔러보는 프롬프트입니다.",
    requires: [{ field: "resumeText", label: "이력서" }],
    nextStep: SAVE_GUIDE + " 답변을 외우지 말고 논리 구조만 기억하세요.",
    build: (ctx) => `당신은 깐깐한 면접관입니다. 지원자를 배려하지 말고, 실제 면접장에서처럼 약점을 정확히 찔러 주세요.

면접 전날 훑어볼 수 있는 **완성된 HTML 파일**로 만들어 주세요.

${companyBlock(ctx)}

${analysisBlock(ctx)}

${myDocumentsBlock(ctx)}

# HTML 문서 구성

\`.page\` 안에:

- 머리말: \`.doc-eyebrow\`("INTERVIEW · 예상 질문 & 방어 논리"), \`.doc-title\`(회사명 + 직무), \`.doc-headline\`
- \`<hr class="rule">\`

## 섹션 1 — 제 서류의 약점 진단 (\`.two-col\`)
왼쪽 \`.col-light\`에 \`.sec-sub\`("면접관이 파고들 지점") + \`ul.list\`,
오른쪽 \`.col-dark\`에 \`.sec-sub\`("미리 준비할 답") + \`ul.list\`.
경력 공백, 직무 전환, 짧은 근속, 관광업 밖 경력, 경험 부족, 지원 동기의 빈약함 등을 냉정하게 짚으세요.

## 섹션 2 — 예상 질문 10개 (\`table.tbl\`)
이 회사·직무에서 실제로 나올 법한 질문 **10개**를 빠르게 훑을 수 있는 표로 만드세요.
열은: No | 예상 질문 | 질문 유형 | 답변 핵심 키워드
질문 유형은 \`<span class="tag ok">경험</span>\` / \`<span class="tag mid">직무</span>\` /
\`<span class="tag gap">압박</span>\` 중 하나로 표시하세요.
10개는 경험형·직무형·압박형·인성형·회사이해형이 고루 섞이게 구성하세요.

## 섹션 3 — 압박 꼬리질문 5개와 방어 논리
질문마다 \`.card\`로:
- \`.card-q\` — 질문 원문 (듣기 좋은 질문 말고 **실제 압박 질문**)
- \`.card-meta\` — "면접관의 의도 · ○○ / 방어 논리 · ○○"
- \`.card-a\` — 답변 예시 150~250자. **인정 → 재해석 → 대안 근거** 구조로
- \`.warn\` — "이렇게 답하면 안 됩니다: ○○" 한 줄

## 섹션 4 — 역질문 3개 (\`ul.list\`)
"질문 있으신가요?"를 들었을 때, 이 회사의 실제 현안을 알고 있다는 걸 드러낼 질문.
연봉·복지 질문은 빼고, **회사의 최근 전략에 대한 질문**으로요.

- 맨 아래 \`.foot\`

${toneBlock(ctx)}

${HONESTY_RULE}

${HTML_OUTPUT_RULES}`,
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
