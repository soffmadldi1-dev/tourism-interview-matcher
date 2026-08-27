import { SECTOR_MAP, TONE_MAP } from "@/lib/presets";
import { HTML_OUTPUT_RULES, SAVE_GUIDE } from "@/lib/html-spec";
import type { PromptContext } from "@/lib/types";

/**
 * 프롬프트 템플릿 모음.
 *
 * 이 앱은 AI를 직접 호출하지 않습니다. 대신 사용자가 그대로 복사해서
 * claude.ai 채팅창에 붙여넣을 수 있는 "완성된 프롬프트"를 만들어 줍니다.
 *
 * 2단계는 [이력서 원고 → 자소서 원고 → 통합 HTML] 3단으로 나눕니다.
 * 같은 대화창에서 이어서 쓰면 마지막 프롬프트가 앞 결과를 그대로 받아
 * **하나의 파일**로 합쳐 주므로, 사용자가 직접 합칠 필요가 없습니다.
 */

export type PromptStage = "analyze" | "document" | "interview";

export interface PromptTemplate {
  id: string;
  stage: PromptStage;
  order: number;
  title: string;
  /** 무엇을 받게 되는지 한 줄 설명 (카드 제목 아래 표시) */
  outcome: string;
  /** 산출물이 HTML 파일인 프롬프트 */
  producesHtml?: boolean;
  /** 앞 프롬프트와 같은 대화창에서 이어서 써야 하는 프롬프트 */
  sameChat?: boolean;
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
      "같은 대화창에서 ①이력서 → ②자기소개서 순서로 만든 뒤, ③에서 하나의 HTML 파일로 합칩니다.",
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
- 마지막에 **제가 직접 확인·수정해야 할 지점**을 목록으로 정리해 주세요.`;

const SAME_CHAT_NOTE = `> ⚠️ 이 프롬프트는 **바로 앞 프롬프트를 실행한 같은 대화창**에 이어서 붙여넣으세요.
> 새 대화창에서 쓰면 앞에서 만든 내용을 가져오지 못합니다.`;

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
    outcome:
      "회사 현황 · 인재상 해석 · 최근 이슈 · 면접 평가 키워드까지 정리된 분석 리포트",
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
    id: "resume-draft",
    stage: "document",
    order: 2,
    title: "① 이력서 원고 다시 쓰기",
    outcome: "이 회사 기준으로 순서와 표현을 고친 이력서 원고 + 무엇을 왜 바꿨는지 표",
    when: "2단계의 시작입니다. Claude 새 대화창을 하나 열고 여기서 시작하세요.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep:
      "이 대화창을 닫지 마세요. 같은 창에서 다음 '② 자기소개서 원고' 프롬프트를 이어서 붙여넣습니다.",
    build: (ctx) => `당신은 관광 산업 채용 서류를 심사해 온 인사 담당자입니다.
같은 이력이라도 **무엇을 앞에 두고 어떤 단어로 쓰느냐**에 따라 서류 통과 여부가 갈린다는 것을 알고 있습니다.

앞으로 저는 이 대화창에서 ①이력서 → ②자기소개서 → ③통합 HTML 순서로 작업할 예정입니다.
지금은 **첫 번째, 이력서 원고**를 만들어 주세요.

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

# 출력할 내용 (이 순서 그대로)

**(0) 헤드라인** — 이력서 맨 위에 올릴 한 문장.
이 회사가 원하는 사람으로 나를 규정하는 문장이어야 합니다. 일반적인 소개 문구는 실패입니다.

**(1) 기본정보** — 제 이력서에 있는 항목만. 없으면 \`(직접 기입)\`

**(2) 핵심 역량 3줄** — 이 회사 기준으로 ①전문 분야 ②대표 성과 ③차별 강점 (각 25자 내외)

**(3) 자기소개** — 300자 내외. 첫 문장에 이 회사의 구체적 현안을 넣으세요.

**(4) 경력** — 관련성 높은 순. 경험마다:
- 기관·역할 / 기간 한 줄
- 성과 개조식 2~3줄 (두괄식, 숫자 포함)
- \`→\` 이 경험이 이 직무에 주는 강점 한 줄

**(5) 학력 / (6) 자격·어학 / (7) 기타 활동**

**(8) 무엇을 왜 바꿨는가** — 표로 5~8행
| 원래 표현 | 바꾼 표현 | 이유 |

**(9) 비어 있는 칸** — 회사가 원하는데 제 이력서에 근거가 없는 항목과, 지금 메울 수 있는 현실적 방법

${toneBlock(ctx)}

${HONESTY_RULE}

지금은 **텍스트 원고만** 주세요. HTML은 세 번째 단계에서 만들 예정입니다.`,
  },

  {
    id: "cover-letter-draft",
    stage: "document",
    order: 3,
    sameChat: true,
    title: "② 자기소개서 원고 다시 쓰기",
    outcome: "문항별 소제목 · 본문 · 글자 수까지 완성된 자기소개서 원고",
    when: "①번을 실행한 같은 대화창에 이어서 붙여넣으세요.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "coverLetterText", label: "자기소개서" },
    ],
    nextStep:
      "이 대화창을 그대로 두고, 다음 '③ 통합 HTML' 프롬프트를 이어서 붙여넣으면 파일 하나로 합쳐집니다.",
    build: (ctx) => `${SAME_CHAT_NOTE}

좋습니다. 이제 **두 번째, 자기소개서 원고**를 만들어 주세요.
**위에서 함께 만든 이력서 원고**의 경험과 표현을 그대로 이어받아 쓰세요.

${companyBlock(ctx)}

# 제 자기소개서 원본
${fill(ctx.coverLetterText, PLACEHOLDER.coverLetter)}

# 다시 쓰는 원칙 (반드시 이 순서로 사고)

1. 기업 분석 결과에서 **이 회사가 지금 필요로 하는 역량**을 먼저 뽑는다.
2. 각 문항이 그중 무엇을 보여줄 수 있는지 판단한다.
3. 위 이력서 원고의 경험 중 **가장 가까운 증거**를 배정한다.
   **같은 경험을 두 문항에 반복하지 마세요.** 소재를 먼저 나눠 놓고 쓰세요.
4. 그 다음에 문장을 고친다.

## 반드시 지킬 것
- 각 문항 첫 문장에서 이 회사의 **구체적인 최근 전략이나 이슈**를 언급하세요.
- "어릴 적부터 관광에 관심이 많아" 류의 감정 서사를 쓰지 마세요.
- **회사 이름만 바꾸면 다른 회사에도 낼 수 있는 문장은 실패**입니다.
- 원본의 글자 수를 유지하세요. (문항에 글자 수 제한이 있으면 그 ±5% 이내)

# 출력할 내용

**(0) 소재 배분표** — 어떤 경험을 어느 문항에 주력으로 쓸지 먼저 표로 정리하세요.
| 소재(경험·강점) | 주력 문항 | 이 문항에서 증명하는 것 |

**(1) 문항별 원고** — 문항마다 아래 4줄 구조로:
- **문항 라벨** (예: Q1. 지원 동기)
- **소제목** — 답변을 한 줄로 압축. 심사자가 이 줄만 읽어도 내용이 그려져야 합니다.
- **본문**
- **글자 수** (예: 402자)

원본에 문항 구분이 없으면 4개 문항으로 나누세요
(지원 동기 / 핵심 경험·역량 / 직무 적합성 / 입사 후 포부).

**(2) 첫 문장 대안** — 각 문항의 도입부 대안을 하나씩 더. 도입부가 읽히느냐 마느냐를 가릅니다.

${toneBlock(ctx)}

${HONESTY_RULE}

지금도 **텍스트 원고만** 주세요. HTML은 다음 단계입니다.`,
  },

  {
    id: "merge-html",
    stage: "document",
    order: 4,
    producesHtml: true,
    sameChat: true,
    title: "③ 이력서 + 자기소개서 통합 HTML 만들기",
    outcome:
      "앞의 두 원고가 한 파일로 합쳐진 A4 완성 문서 — 그대로 저장해 제출할 수 있습니다",
    when: "①②를 실행한 같은 대화창에 이어서 붙여넣으세요. 두 결과가 자동으로 합쳐집니다.",
    requires: [
      { field: "companyAnalysis", label: "기업 분석 결과" },
      { field: "resumeText", label: "이력서" },
    ],
    nextStep: SAVE_GUIDE,
    build: (ctx) => `${SAME_CHAT_NOTE}

당신은 이 대화에서 저의 이력서와 자기소개서를 함께 만든 **문서 편집자이자 디자이너**입니다.
내용 통합뿐 아니라 조판·서식까지 책임집니다.

# 목표

**위 대화의 ①이력서 원고와 ②자기소개서 원고를**, 손대지 않고 그대로 제출할 수 있는
**A4 완성 문서 하나**로 통합해 주세요.

- P1 = 이력서 / P2 = 자기소개서. 페이지당 정확히 1장.
- 이력서 내용이 많으면 P1을 두 장으로 나누고, 두 번째 장 눈썹에 "RESUME · 이력서 (계속)"을 붙이세요.
- 지원 정보: ${fill(ctx.companyName, "[기업명]")} / ${fill(ctx.jobTitle, "[직무명]")}

**텍스트 원고만 다시 내놓으면 미완료입니다.** 아래 CSS 규격을 적용한 HTML 파일까지 만들어야 완료입니다.

# 페이지별 구성

## P1 — 이력서
- \`.doc-eyebrow\` "RESUME · 이력서"
- \`.doc-title\` 제 이름
- \`.doc-headline\` 위에서 만든 **헤드라인 문장**
- \`<hr class="rule">\`
- \`01 기본정보\` \`.kv\` / \`02 핵심 역량\` \`.three\` / \`03 자기소개\` \`.intro\`
- \`04 경력\` — \`.job\` \`.job-top\` \`.job-name\` \`.job-date\` \`.job-desc\`
  경험마다 마지막 줄에 \`→ 직무 연결\` 문장을 \`.job-desc\` 안에 \`<b>\`로 강조
- \`05 학력\` / \`06 자격 및 어학\` / \`07 기타 활동\` — \`ul.list\` 또는 \`.chips\`
- \`.foot\`

## P2 — 자기소개서
- \`.doc-eyebrow\` "COVER LETTER · 자기소개서"
- \`.doc-title\` "자기소개서"
- \`.doc-headline\` 지원 직무 / 제 이름
- \`<hr class="rule">\`
- 문항마다 \`.qa\` 블록: \`.qa-q\`(문항 라벨) → \`.qa-h\`(소제목) → \`.qa-body\`(본문) → \`.qa-count\`(글자 수)
- 문항 사이에 \`<hr class="rule-soft">\`
- \`.foot\`

# 통합 규칙

1. 위 대화에서 확정된 내용과 **다른 새로운 사실·숫자를 절대 추가하지 마세요.** 없으면 \`(직접 기입)\`.
2. 각 페이지는 A4 한 장에 담기게 분량을 조절하세요. (넘치면 근거 문장을 줄이고, 비면 한 줄씩 붙입니다)
3. 지원 직무가 헤드라인과 핵심 역량에 드러나 있는지 확인하고, 빠졌으면 반영해 다듬으세요.
4. \`.foot\`에는 왼쪽에 제 이름과 지원 직무, 오른쪽에 작성일을 넣으세요.

# 파일명 안내
HTML 코드 블록이 끝난 뒤, 저장할 파일명을 한 줄로 제안해 주세요.
**영문 소문자·숫자·하이픈만** 사용하세요. (한글 파일명은 브라우저·메일에서 깨질 수 있습니다)
예: \`hong-gildong_application_260826.html\`

${HTML_OUTPUT_RULES}`,
  },

  /* ── 3단계 ─────────────────────────────────────────────── */
  {
    id: "pitch-html",
    stage: "interview",
    order: 5,
    producesHtml: true,
    title: "1분 자기소개 + 매칭표 HTML 만들기",
    outcome:
      "기업 니즈↔내 경험 매칭표 4~6행 + 55~70초 자기소개 스크립트 + 캐치프레이즈 3개",
    when: "면접 준비의 첫 단추입니다. 새 대화창에서 시작해도 됩니다.",
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
    order: 6,
    producesHtml: true,
    title: "핵심 경험 STAR 답변 HTML 만들기",
    outcome:
      "이 회사에서 나올 법한 질문 4개와, 각각에 대한 STAR 에피소드(상황·과제·행동·결과) 도출",
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
    order: 7,
    producesHtml: true,
    title: "예상 질문 10개 + 압박 방어 논리 HTML 만들기",
    outcome:
      "예상 질문 10개 표(유형별) + 내 서류의 약점 진단 + 압박 꼬리질문 5개 방어 논리 + 역질문 3개",
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
