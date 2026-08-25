import { z } from "zod";

/**
 * Zod 스키마 모음.
 *  - `*Input`  : 클라이언트 → API 요청 본문 검증 (React Hook Form과 공유)
 *  - `*Schema` : Claude structured outputs(`output_config.format`)용 응답 스키마
 *
 * ⚠️ structured outputs 스키마에는 `.optional()` / `.min()` 등을 쓰지 않습니다.
 *    (strict JSON Schema로 변환될 때 모든 필드가 required 여야 하므로,
 *     "없음"은 빈 문자열 / 빈 배열로 표현하도록 프롬프트에서 지시합니다.)
 */

/* ────────────────────────────────────────────────────────────
 * 공용 enum
 * ──────────────────────────────────────────────────────────── */

export const SECTOR_VALUES = [
  "hotel",
  "ota",
  "public",
  "mice",
  "transport",
  "other",
] as const;

export const TONE_VALUES = ["confident", "calm", "global"] as const;

export const sectorSchema = z.enum(SECTOR_VALUES);
export const toneSchema = z.enum(TONE_VALUES);

/* ────────────────────────────────────────────────────────────
 * Step 1 — 기업 분석 요청
 * ──────────────────────────────────────────────────────────── */

export const companySearchInputSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "기업명을 2자 이상 입력해 주세요.")
    .max(60, "기업명이 너무 깁니다."),
  jobTitle: z
    .string()
    .trim()
    .min(2, "지원 직무를 2자 이상 입력해 주세요.")
    .max(60, "직무명이 너무 깁니다."),
  sector: sectorSchema,
  /** 사용자가 직접 덧붙이는 참고 정보 (채용공고 발췌 등) */
  extraContext: z.string().trim().max(4000).default(""),
});

export type CompanySearchInput = z.infer<typeof companySearchInputSchema>;

/* ────────────────────────────────────────────────────────────
 * Step 1 — 기업 분석 결과 (LLM structured output)
 * ──────────────────────────────────────────────────────────── */

export const companyIntelCoreSchema = z.object({
  companyName: z.string().describe("정식 기업/기관명"),
  jobTitle: z.string().describe("분석 대상 직무"),
  overview: z
    .string()
    .describe("이 기업이 지금 어떤 상황에 놓여 있는지 3~4문장 브리핑"),
  identity: z.object({
    mission: z.string().describe("미션. 공식 문구가 없으면 사업 방향에서 추론하고 '(추정)' 표기"),
    vision: z.string().describe("비전. 없으면 '(추정)' 표기"),
    talentProfile: z
      .array(
        z.object({
          keyword: z.string().describe("인재상 키워드"),
          interpretation: z
            .string()
            .describe("이 키워드가 실제 면접에서 무엇을 검증하려는 것인지 해석"),
        }),
      )
      .describe("인재상 3~5개"),
  }),
  business: z.object({
    coreModels: z.array(z.string()).describe("현재 핵심 사업/수익 모델 3~5개"),
    newStrategies: z
      .array(
        z.object({
          title: z.string().describe("전략명 (예: 인바운드 개별관광객(FIT) 확대)"),
          detail: z.string().describe("무엇을, 왜, 어떻게 하고 있는지 2~3문장"),
          timeframe: z.string().describe("추진 시점 (예: 2025년 하반기~, 불명확하면 '시점 미상')"),
        }),
      )
      .describe("최근 1~2년 신규 전략 3~5개 (DX 전환, 로컬관광, 인·아웃바운드 등)"),
  }),
  recentIssues: z
    .array(
      z.object({
        date: z.string().describe("YYYY-MM 또는 YYYY-MM-DD. 불명확하면 '시점 미상'"),
        title: z.string(),
        summary: z.string().describe("2~3문장 요약"),
        category: z.enum([
          "보도자료",
          "사업/전략",
          "실적",
          "행사/캠페인",
          "채용/조직",
          "리스크",
          "기타",
        ]),
        interviewAngle: z
          .string()
          .describe("이 이슈를 면접에서 어떤 각도로 언급하면 좋은지 한 문장"),
        sourceUrl: z.string().describe("출처 URL. 없으면 빈 문자열"),
      }),
    )
    .describe("최근 이슈·보도자료·행사 4~6건 (최신순)"),
  interviewerKeywords: z
    .array(
      z.object({
        keyword: z.string(),
        why: z.string().describe("면접관이 이 키워드를 중요하게 보는 이유"),
        sampleQuestion: z.string().describe("이 키워드에서 파생될 실제 질문 예시"),
      }),
    )
    .describe("면접관 관점 핵심 평가 키워드 4~6개"),
  watchOuts: z
    .array(z.string())
    .describe("지원자가 모르고 말하면 감점될 수 있는 현안·리스크 2~4개"),
  sources: z
    .array(z.object({ title: z.string(), url: z.string() }))
    .describe("실제 참고한 출처. 검색 결과가 없으면 빈 배열"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("근거 신뢰도. 검색 근거 없이 사전지식으로만 작성했다면 low"),
  dataAsOf: z.string().describe("근거 데이터 기준 시점 (예: 2026-08)"),
});

export type CompanyIntelCore = z.infer<typeof companyIntelCoreSchema>;

/* ────────────────────────────────────────────────────────────
 * Step 2/3 — 스토리 생성 요청
 * ──────────────────────────────────────────────────────────── */

export const candidateProfileSchema = z.object({
  strengthTags: z
    .array(z.string().trim().min(1))
    .min(1, "강점 태그를 1개 이상 선택하거나 입력해 주세요.")
    .max(12, "강점 태그는 최대 12개까지입니다."),
  strengthDetail: z
    .string()
    .trim()
    .max(2000, "2000자 이내로 입력해 주세요.")
    .default(""),
  experiences: z
    .string()
    .trim()
    .min(30, "주요 이력/프로젝트를 30자 이상 구체적으로 입력해 주세요.")
    .max(6000, "6000자 이내로 입력해 주세요."),
  motivationDraft: z.string().trim().max(2000).default(""),
  tone: toneSchema,
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;

export const generateStoryInputSchema = z.object({
  /** Step 1에서 받은 기업 분석 결과를 그대로 전달 */
  companyIntel: companyIntelCoreSchema,
  /** 업종 프리셋 (Step 1 요청과 동일한 값) */
  sector: sectorSchema.default("other"),
  candidate: candidateProfileSchema,
});

export type GenerateStoryInput = z.infer<typeof generateStoryInputSchema>;

/* ────────────────────────────────────────────────────────────
 * Step 3 — 면접 스토리 패키지 (LLM structured output)
 * ──────────────────────────────────────────────────────────── */

export const storyPackageSchema = z.object({
  oneMinutePitch: z.object({
    headline: z
      .string()
      .describe("자기소개를 한 줄로 압축한 캐치프레이즈 (면접관이 기억할 라벨)"),
    script: z
      .string()
      .describe(
        "실제로 말할 1분 자기소개 전문. 350~420자. 기업의 현재 고민 → 내 역량 → 근거 → 기여 순서",
      ),
    estimatedSeconds: z.number().describe("말했을 때 예상 소요 시간(초)"),
    deliveryTips: z.array(z.string()).describe("전달 시 강조점/호흡 팁 3개"),
  }),
  matchMatrix: z
    .array(
      z.object({
        companyNeed: z.string().describe("기업이 지금 필요로 하는 것 (Step1 근거 기반)"),
        candidateEvidence: z.string().describe("지원자의 실제 경험 근거"),
        level: z
          .enum(["strong", "moderate", "gap"])
          .describe("연결 강도. 근거가 약하면 솔직히 gap"),
        bridge: z.string().describe("둘을 잇는 한 문장 논리"),
      }),
    )
    .describe("기업 니즈 ↔ 지원자 경험 1:1 교차 매칭 4~6행. gap도 최소 1개는 정직하게 포함"),
  starAnswers: z
    .array(
      z.object({
        question: z.string().describe("실제 나올 법한 면접 질문"),
        companyHook: z.string().describe("이 답변이 기업의 어떤 현안과 연결되는지"),
        situation: z.string(),
        task: z.string(),
        action: z.string().describe("지원자가 한 행동을 구체적 동사로. 3~4문장"),
        result: z.string().describe("결과. 숫자가 있으면 반드시 포함"),
        bridgeToCompany: z.string().describe("답변을 지원 기업으로 연결하는 마무리 한 문장"),
        metrics: z.array(z.string()).describe("정량 지표. 없으면 빈 배열"),
      }),
    )
    .describe("STAR 기법 핵심 경험 매칭 답변 3개"),
  motivation: z.object({
    script: z
      .string()
      .describe("지원동기 답변 전문. 400~500자. '좋아해서'가 아니라 기업 현안 기반으로"),
    contributionPlan: z
      .array(
        z.object({
          phase: z.string().describe("예: 입사 0~3개월 / 3~6개월 / 6~12개월"),
          actions: z.array(z.string()).describe("해당 시기에 할 구체적 액션 2~3개"),
        }),
      )
      .describe("입사 후 기여 로드맵 3단계"),
  }),
  followUps: z
    .array(
      z.object({
        question: z.string().describe("압박성 꼬리질문"),
        intent: z.string().describe("면접관이 이 질문으로 확인하려는 것"),
        defense: z.string().describe("방어 논리 요지 한 문장"),
        sampleAnswer: z.string().describe("실제 답변 예시 150~250자"),
      }),
    )
    .describe("예상 꼬리질문 및 방어 논리 3개"),
  cautions: z
    .array(z.string())
    .describe("사실과 다르게 말하면 위험한 지점 / 반드시 본인 경험으로 검증할 부분 2~4개"),
});

export type StoryPackage = z.infer<typeof storyPackageSchema>;
