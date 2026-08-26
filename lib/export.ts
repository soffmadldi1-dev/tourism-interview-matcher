import { SECTOR_MAP, TONE_MAP } from "@/lib/presets";
import { PROMPT_TEMPLATES, STAGE_META } from "@/lib/prompt-templates";
import { buildSearchGroups } from "@/lib/search-links";
import type { PromptContext } from "@/lib/types";

/**
 * 내보내기 — 클립보드 복사 / 마크다운 다운로드 / 인쇄
 */

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

export function safeFilename(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join("_")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

/** 검색 링크 + 프롬프트 전체를 하나의 마크다운 파일로 */
export function buildWorkbook(ctx: PromptContext): string {
  const lines: string[] = [];
  const sector = SECTOR_MAP[ctx.sector];

  lines.push(`# ${ctx.companyName || "기업"} ${ctx.jobTitle || ""} 취업 준비 워크북`.trim());
  lines.push("");
  lines.push(`- 업종: ${sector.label}`);
  lines.push(`- 톤앤매너: ${TONE_MAP[ctx.tone].label}`);
  if (ctx.homepageUrl) lines.push(`- 홈페이지: ${ctx.homepageUrl}`);
  lines.push(`- 작성일: ${new Date().toLocaleDateString("ko-KR")}`);
  lines.push("");
  lines.push("> 이 워크북의 프롬프트를 claude.ai 채팅창에 붙여넣어 사용하세요.");
  lines.push("");
  lines.push("---");
  lines.push("");

  /* 검색 링크 */
  const groups = buildSearchGroups(ctx.companyName, ctx.jobTitle, ctx.sector, ctx.homepageUrl);
  if (groups.length > 0) {
    lines.push("## 자료 수집 링크");
    lines.push("");
    for (const group of groups) {
      lines.push(`### ${group.step}. ${group.title}`);
      lines.push(group.goal);
      lines.push("");
      for (const link of group.links) {
        lines.push(`- ${link.essential ? "**[필수]** " : ""}[${link.label}](${link.url})`);
        lines.push(`  - 복사할 것: ${link.copyThis}`);
      }
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  /* 프롬프트 */
  lines.push("## 프롬프트 모음");
  lines.push("");

  let currentStage = "";
  for (const template of [...PROMPT_TEMPLATES].sort((a, b) => a.order - b.order)) {
    if (template.stage !== currentStage) {
      currentStage = template.stage;
      const meta = STAGE_META[template.stage];
      lines.push(`### ${meta.label}`);
      lines.push(meta.description);
      lines.push("");
    }

    lines.push(`#### ${template.order}. ${template.title}`);
    lines.push(`> ${template.when}`);
    lines.push("");
    lines.push("````");
    lines.push(template.build(ctx));
    lines.push("````");
    lines.push("");
    lines.push(`**다음 단계**: ${template.nextStep}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "_AI가 만든 결과는 초안입니다. 기업 정보와 본인 경험의 사실 여부를 반드시 직접 확인한 뒤 사용하세요._",
  );

  return lines.join("\n");
}
