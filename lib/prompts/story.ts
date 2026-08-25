import { SECTOR_MAP, TONE_MAP } from "@/lib/presets";
import type { CandidateProfileInput, CompanyIntelCore } from "@/lib/schemas";
import type { TourismSector } from "@/lib/types";

/**
 * Step 3 — 매칭 & 스토리 생성 프롬프트 모듈.
 *
 * 핵심 설계: "지원자 경험 → 기업 현안" 이 아니라 "기업 현안 → 지원자 경험" 순으로 사고하게 합니다.
 * 그래야 자기 자랑이 아니라 "이 회사에 지금 필요한 사람"이라는 논리가 나옵니다.
 */

export const STORY_COACH_SYSTEM = `당신은 한국 관광 산업 취업·이직 면접 코치입니다.
호텔, 여행사·OTA, 관광 공공기관, MICE, 항공 분야 면접관으로도 여러 차례 참여해 왔습니다.

당신의 강점은 지원자의 평범해 보이는 경험에서 "이 회사가 지금 필요로 하는 증거"를 찾아내는 것입니다.

절대 원칙:
1. **지원자가 제공하지 않은 경험을 만들어내지 않습니다.** 숫자, 회사명, 성과를 창작하는 것은 최악의 실패입니다.
   구체성이 부족하면 답변 안에 "[여기에 실제 수치를 넣으세요]" 같은 플레이스홀더를 남기고, cautions 에 적으세요.
2. 기업 분석 결과에 있는 사실만 기업 측 근거로 씁니다.
3. 강점이 없는 영역은 정직하게 gap 으로 표시하고, 대신 어떻게 방어할지 알려줍니다.
4. 관광업 면접의 현실을 반영합니다 — 현장 대응력, 교대·성수기 근무 감내, 컴플레인 처리, 외국어, 채널·수익 감각.
5. "열정", "고객 감동" 같은 공허한 표현 대신, 행동과 결과로 말하게 만듭니다.
6. 실제 입 밖으로 낼 수 있는 구어체로 씁니다. 글로 읽는 문장이 아니라 말하는 문장입니다.`;

export interface StoryPromptContext {
  companyIntel: CompanyIntelCore;
  candidate: CandidateProfileInput;
  sector: TourismSector;
}

export function buildStoryPrompt(ctx: StoryPromptContext): string {
  const { companyIntel: intel, candidate } = ctx;
  const preset = SECTOR_MAP[ctx.sector];
  const tone = TONE_MAP[candidate.tone];

  return `# 1. 지원 기업 분석 결과 (Step 1 산출물 — 이것만을 기업 측 사실 근거로 사용)

## 기본
- 기업/기관: ${intel.companyName}
- 지원 직무: ${intel.jobTitle}
- 업종: ${preset.label}
- 현황 브리핑: ${intel.overview}
- 근거 신뢰도: ${intel.confidence} (기준 시점 ${intel.dataAsOf})

## 미션·비전·인재상
- 미션: ${intel.identity.mission || "(확인되지 않음)"}
- 비전: ${intel.identity.vision || "(확인되지 않음)"}
- 인재상:
${intel.identity.talentProfile.map((t) => `  · ${t.keyword} → ${t.interpretation}`).join("\n") || "  (확인되지 않음)"}

## 사업 모델
- 핵심 모델: ${intel.business.coreModels.join(" / ") || "(확인되지 않음)"}
- 최근 신규 전략:
${
    intel.business.newStrategies
      .map((s) => `  · [${s.timeframe}] ${s.title} — ${s.detail}`)
      .join("\n") || "  (확인되지 않음)"
  }

## 최근 이슈
${
    intel.recentIssues
      .map((i) => `  · (${i.date}, ${i.category}) ${i.title} — ${i.summary} / 면접 활용각: ${i.interviewAngle}`)
      .join("\n") || "  (확인되지 않음)"
  }

## 면접관이 볼 평가 키워드
${
    intel.interviewerKeywords
      .map((k) => `  · ${k.keyword} — ${k.why} (예상 질문: "${k.sampleQuestion}")`)
      .join("\n") || "  (확인되지 않음)"
  }

## 주의할 현안
${intel.watchOuts.map((w) => `  · ${w}`).join("\n") || "  (없음)"}

# 2. 지원자 프로필

## 핵심 강점 태그
${candidate.strengthTags.map((t) => `  · ${t}`).join("\n")}

## 강점 상세 기술
${candidate.strengthDetail || "(추가 기술 없음 — 위 태그와 아래 이력만으로 판단할 것)"}

## 주요 이력 / 프로젝트 / 실무·아르바이트 경험
${candidate.experiences}

## 지원동기 초안 (지원자 작성)
${candidate.motivationDraft || "(작성하지 않음 — 기업 분석과 경험을 근거로 새로 설계할 것)"}

# 3. 작업 지시

## 사고 순서 (반드시 이 순서로)
1) 기업이 **지금** 필요로 하는 역량 4~6개를 위 분석에서 뽑는다. (인재상 문구가 아니라 신규 전략·최근 이슈에서 뽑을 것)
2) 각 항목에 대해 지원자의 실제 경험 중 **가장 가까운 증거** 하나를 찾는다.
3) 증거가 약한 항목은 솔직히 gap 으로 표시하고, 그 gap 을 어떻게 방어할지 설계한다.
4) 그 매칭 결과를 바탕으로 자기소개 → STAR → 지원동기 → 꼬리질문 순으로 산출물을 만든다.

## 산출물별 지침

### oneMinutePitch (맞춤형 1분 자기소개)
- 구조: [기업의 현재 상황 인식 한 문장] → [나를 규정하는 한 문장] → [그 근거가 되는 경험 1~2개] → [입사 후 무엇을 하겠다]
- 350~420자. 실제로 말했을 때 55~70초.
- 첫 문장에서 반드시 이 기업의 **구체적인 최근 전략이나 이슈**를 언급합니다. 일반론으로 시작하면 실패입니다.
- \`deliveryTips\`: 어디서 끊어 읽을지, 어느 단어를 강조할지 등 전달 팁 3개.

### matchMatrix (기업 니즈 ↔ 경험 교차 매칭)
- 4~6행. 각 행은 기업 니즈 1개 : 지원자 근거 1개로 1:1 대응.
- \`level\` 은 정직하게. 최소 1개는 \`gap\` 으로 표시하고 \`bridge\` 에 보완 논리를 씁니다.

### starAnswers (핵심 경험 매칭 답변, STAR 기법) — 3개
- 각 답변은 기업의 서로 다른 현안과 연결되어야 합니다. 같은 경험을 두 번 쓰지 마세요.
- Situation/Task 는 짧게(각 1~2문장), Action 은 길게(3~4문장, 구체적 행동 동사), Result 는 숫자 우선.
- 지원자가 숫자를 제공하지 않았다면 창작하지 말고 "[실제 수치 기입]" 플레이스홀더를 남깁니다.
- \`bridgeToCompany\`: "이 경험이 ${intel.companyName}의 ○○ 상황에서 이렇게 쓰입니다" 형태로 마무리.

### motivation (지원동기 및 입사 후 기여 방안)
- "예전부터 좋아해서"류의 감정 서사를 금지합니다. 기업의 현안 → 내가 풀 수 있는 이유 → 근거 순.
- \`contributionPlan\`: 0~3개월(적응·파악) / 3~6개월(첫 성과) / 6~12개월(확장) 3단계.
  각 액션은 이 기업의 실제 사업/전략 이름을 넣어 구체적으로 씁니다.

### followUps (예상 꼬리질문 및 방어 논리) — 3개
- 지원자 이력의 **가장 약한 지점**을 겨냥한 질문으로 만듭니다. (경력 공백, 직무 전환, 짧은 근속, 경험 부족, 관광업 밖 경력 등)
- 듣기 좋은 질문이 아니라 실제 압박 질문이어야 합니다.
- \`sampleAnswer\`: 인정 → 재해석 → 대안 근거 구조로 150~250자.

### cautions
- 이 스크립트를 그대로 쓰기 전에 지원자가 반드시 사실 확인해야 할 지점 2~4개.
- 플레이스홀더를 남겼다면 여기에 명시합니다.

## 톤앤매너: ${tone.label} (${tone.short})
${tone.instruction}

모든 산출물은 한국어로, 실제 면접에서 소리 내어 말할 수 있는 문장으로 작성하세요.`;
}
