"use client";

import { ArrowDown, ClipboardPaste, FileText } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PromptContext } from "@/lib/types";

interface MaterialFormProps {
  context: PromptContext;
  onChange: (patch: Partial<PromptContext>) => void;
}

const MATERIAL_PLACEHOLDER = `여기에 붙여넣으세요. 정리하지 않아도 됩니다.

예시)
[채용공고]
자격요건: 대졸 이상, 신입 및 경력 1년 이상
우대사항: 컨벤션기획사 2급, 영어 가능자

[인재상]
도전, 협업, 전문성

[최근 뉴스]
2026.06 국제회의 유치 실적 1위 달성
2025.11 디지털 전시 플랫폼 오픈`;

const ANALYSIS_PLACEHOLDER = `아직 비어 있습니다. 순서:

1. 위 칸을 먼저 채우세요.
2. 오른쪽 위에서 '1단계 기업 분석' 탭을 클릭하세요.
3. 그 안의 프롬프트를 복사해서 Claude(claude.ai)에 붙여넣으세요.
4. Claude가 답한 내용 전체를 복사해서 여기에 붙여넣으세요.`;

export function MaterialForm({ context, onChange }: MaterialFormProps) {
  const materialCount = context.collectedMaterial.trim().length;
  const analysisCount = context.companyAnalysis.trim().length;

  return (
    <div className="space-y-4">
      {/* ① 수집한 자료 */}
      <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-start justify-between gap-2">
          <Label htmlFor="collectedMaterial" className="flex items-center gap-1.5 text-[13px]">
            <ClipboardPaste className="h-3.5 w-3.5 text-primary" />
            ① 내가 검색해서 찾은 회사 정보
          </Label>
          <CharCount count={materialCount} good={300} />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          오른쪽 <strong className="text-foreground">&lsquo;자료 찾기&rsquo;</strong> 탭의 링크를 열어서
          <br />
          <strong className="text-foreground">채용공고 · 인재상 · 최근 뉴스</strong>를 복사해 오세요.
          <br />
          형식 없이 그냥 붙여넣으면 됩니다.
        </p>

        <Textarea
          id="collectedMaterial"
          rows={12}
          placeholder={MATERIAL_PLACEHOLDER}
          className="bg-background text-[13px] leading-relaxed"
          value={context.collectedMaterial}
          onChange={(event) => onChange({ collectedMaterial: event.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">
          300자만 넘어도 결과가 확 좋아집니다.
        </p>
      </div>

      {/* 흐름 표시 */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <ArrowDown className="h-3.5 w-3.5" />
        위 자료로 Claude에게 분석을 시킨 뒤, 그 답변을 아래에
        <ArrowDown className="h-3.5 w-3.5" />
      </div>

      {/* ② 기업 분석 결과 */}
      <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-start justify-between gap-2">
          <Label htmlFor="companyAnalysis" className="flex items-center gap-1.5 text-[13px]">
            <FileText className="h-3.5 w-3.5 text-primary" />② &lsquo;1단계 기업 분석&rsquo;에서
            Claude가 준 답변
          </Label>
          <CharCount count={analysisCount} good={500} />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          오른쪽 위 <strong className="text-foreground">&lsquo;1단계 기업 분석&rsquo;</strong> 탭의
          프롬프트를 복사해 Claude에 붙여넣으면 답변이 나옵니다. 그 답변{" "}
          <strong className="text-foreground">전체</strong>를 여기에 붙여넣으세요.
          <br />이 칸을 채우면 <strong className="text-foreground">2·3단계 프롬프트가 모두 열립니다.</strong>
        </p>

        <Textarea
          id="companyAnalysis"
          rows={10}
          placeholder={ANALYSIS_PLACEHOLDER}
          className="bg-background text-[13px] leading-relaxed"
          value={context.companyAnalysis}
          onChange={(event) => onChange({ companyAnalysis: event.target.value })}
        />
      </div>
    </div>
  );
}

function CharCount({ count, good }: { count: number; good: number }) {
  const enough = count >= good;
  return (
    <span
      className={
        enough
          ? "shrink-0 text-[11px] font-medium text-emerald-700"
          : "shrink-0 text-[11px] text-muted-foreground"
      }
    >
      {count.toLocaleString()}자{enough ? " ✓" : ""}
    </span>
  );
}
