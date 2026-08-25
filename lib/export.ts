import { PROVIDER_LABEL, SECTOR_MAP, TONE_MAP } from "@/lib/presets";
import type {
  CandidateProfileInput,
  CompanyIntel,
  StoryPackage,
} from "@/lib/types";

/**
 * 산출물 내보내기 — 마크다운 생성 / 클립보드 복사 / .md 다운로드 / PDF(인쇄) 저장
 */

const LEVEL_LABEL = {
  strong: "✅ 강함",
  moderate: "🟡 보통",
  gap: "🔴 보완 필요",
} as const;

/* ────────────────────────────────────────────────────────────
 * 마크다운 빌더
 * ──────────────────────────────────────────────────────────── */

export function companyIntelToMarkdown(intel: CompanyIntel): string {
  const sector = SECTOR_MAP[intel.sector]?.label ?? "기타";
  const lines: string[] = [];

  lines.push(`# ${intel.companyName} 기업 분석 리포트`);
  lines.push(
    `> 지원 직무: **${intel.jobTitle}** · 업종: ${sector} · 기준 시점: ${intel.dataAsOf}`,
  );
  lines.push(
    `> 근거: ${PROVIDER_LABEL[intel.retrieval.provider]} (검색 결과 ${intel.retrieval.resultCount}건) · 신뢰도: ${intel.confidence}`,
  );
  if (intel.retrieval.notice) lines.push(`> ⚠️ ${intel.retrieval.notice}`);
  lines.push("");

  lines.push("## 한눈에 보기");
  lines.push(intel.overview, "");

  lines.push("## 1. 미션 · 비전 · 인재상");
  lines.push(`- **미션**: ${intel.identity.mission || "확인되지 않음"}`);
  lines.push(`- **비전**: ${intel.identity.vision || "확인되지 않음"}`);
  lines.push("- **인재상**");
  for (const item of intel.identity.talentProfile) {
    lines.push(`  - \`${item.keyword}\` — ${item.interpretation}`);
  }
  lines.push("");

  lines.push("## 2. 사업 모델 및 신규 전략");
  lines.push("### 핵심 사업 모델");
  for (const model of intel.business.coreModels) lines.push(`- ${model}`);
  lines.push("");
  lines.push("### 최근 1~2년 신규 전략");
  for (const strategy of intel.business.newStrategies) {
    lines.push(`- **${strategy.title}** _(${strategy.timeframe})_`);
    lines.push(`  - ${strategy.detail}`);
  }
  lines.push("");

  lines.push("## 3. 최근 이슈 · 보도자료 · 행사");
  for (const issue of intel.recentIssues) {
    lines.push(`- **[${issue.date}] ${issue.title}** \`${issue.category}\``);
    lines.push(`  - ${issue.summary}`);
    lines.push(`  - 💡 면접 활용각: ${issue.interviewAngle}`);
    if (issue.sourceUrl) lines.push(`  - 출처: ${issue.sourceUrl}`);
  }
  lines.push("");

  lines.push("## 4. 면접관 관점 핵심 평가 키워드");
  for (const keyword of intel.interviewerKeywords) {
    lines.push(`- **${keyword.keyword}** — ${keyword.why}`);
    lines.push(`  - 예상 질문: "${keyword.sampleQuestion}"`);
  }
  lines.push("");

  if (intel.watchOuts.length) {
    lines.push("## 5. 주의할 현안");
    for (const item of intel.watchOuts) lines.push(`- ⚠️ ${item}`);
    lines.push("");
  }

  if (intel.sources.length) {
    lines.push("## 참고 출처");
    for (const source of intel.sources) lines.push(`- [${source.title}](${source.url})`);
    lines.push("");
  }

  return lines.join("\n");
}

export function storyToMarkdown(
  story: StoryPackage,
  intel: CompanyIntel,
  candidate: CandidateProfileInput,
): string {
  const lines: string[] = [];

  lines.push(`# ${intel.companyName} ${intel.jobTitle} 면접 스토리 패키지`);
  lines.push(`> 톤앤매너: ${TONE_MAP[candidate.tone].label}`);
  lines.push("");

  lines.push("## 1. 맞춤형 1분 자기소개");
  lines.push(`**${story.oneMinutePitch.headline}**`);
  lines.push("");
  lines.push(story.oneMinutePitch.script);
  lines.push("");
  lines.push(`_예상 소요 시간: 약 ${story.oneMinutePitch.estimatedSeconds}초_`);
  lines.push("");
  lines.push("**전달 팁**");
  for (const tip of story.oneMinutePitch.deliveryTips) lines.push(`- ${tip}`);
  lines.push("");

  lines.push("## 2. 기업 니즈 ↔ 내 경험 매칭");
  lines.push("| 기업이 필요로 하는 것 | 내 근거 경험 | 연결 강도 | 연결 논리 |");
  lines.push("| --- | --- | --- | --- |");
  for (const row of story.matchMatrix) {
    lines.push(
      `| ${esc(row.companyNeed)} | ${esc(row.candidateEvidence)} | ${LEVEL_LABEL[row.level]} | ${esc(row.bridge)} |`,
    );
  }
  lines.push("");

  lines.push("## 3. 핵심 경험 매칭 답변 (STAR)");
  story.starAnswers.forEach((answer, i) => {
    lines.push(`### Q${i + 1}. ${answer.question}`);
    lines.push(`> 기업 연결점: ${answer.companyHook}`);
    lines.push("");
    lines.push(`- **S (상황)**: ${answer.situation}`);
    lines.push(`- **T (과제)**: ${answer.task}`);
    lines.push(`- **A (행동)**: ${answer.action}`);
    lines.push(`- **R (결과)**: ${answer.result}`);
    if (answer.metrics.length) {
      lines.push(`- **핵심 지표**: ${answer.metrics.join(" · ")}`);
    }
    lines.push(`- **마무리 연결**: ${answer.bridgeToCompany}`);
    lines.push("");
  });

  lines.push("## 4. 지원동기 및 입사 후 기여 방안");
  lines.push(story.motivation.script);
  lines.push("");
  for (const phase of story.motivation.contributionPlan) {
    lines.push(`### ${phase.phase}`);
    for (const action of phase.actions) lines.push(`- ${action}`);
    lines.push("");
  }

  lines.push("## 5. 예상 꼬리질문 및 방어 논리");
  story.followUps.forEach((followUp, i) => {
    lines.push(`### 꼬리질문 ${i + 1}. ${followUp.question}`);
    lines.push(`- **면접관 의도**: ${followUp.intent}`);
    lines.push(`- **방어 논리**: ${followUp.defense}`);
    lines.push(`- **답변 예시**: ${followUp.sampleAnswer}`);
    lines.push("");
  });

  if (story.cautions.length) {
    lines.push("## ⚠️ 사용 전 반드시 확인할 것");
    for (const caution of story.cautions) lines.push(`- ${caution}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function fullReportToMarkdown(
  intel: CompanyIntel,
  story: StoryPackage | null,
  candidate: CandidateProfileInput | null,
): string {
  const parts = [companyIntelToMarkdown(intel)];
  if (story && candidate) {
    parts.push("\n---\n", storyToMarkdown(story, intel, candidate));
  }
  parts.push(
    "\n---\n",
    `_관광 면접 스토리 매처로 생성 · ${new Date().toLocaleString("ko-KR")}_`,
    "_AI가 생성한 초안입니다. 기업 정보와 본인 경험의 사실 여부를 반드시 직접 확인하세요._",
  );
  return parts.join("\n");
}

/* ────────────────────────────────────────────────────────────
 * 브라우저 동작
 * ──────────────────────────────────────────────────────────── */

/** 클립보드 복사. execCommand 폴백 포함 (비 HTTPS 환경 대비) */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 폴백으로 진행
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** 브라우저 인쇄 대화상자 → "PDF로 저장" */
export function printToPdf(): void {
  window.print();
}

export function safeFilename(...parts: string[]): string {
  return parts
    .join("_")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

function esc(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
