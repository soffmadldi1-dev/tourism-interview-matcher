"use client";

import { ClipboardPaste, FileText } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/feedback";
import type { PromptContext } from "@/lib/types";

interface MaterialFormProps {
  context: PromptContext;
  onChange: (patch: Partial<PromptContext>) => void;
}

const MATERIAL_PLACEHOLDER = `검색 링크에서 본 내용을 복사해서 여기에 붙여넣으세요.
정리하지 않아도 됩니다 — 그대로 붙여넣으면 AI가 알아서 정리합니다.

이런 것들을 모으면 좋습니다:
· 채용공고의 자격요건 / 우대사항 (가장 중요!)
· 홈페이지의 인재상 · 미션 · 비전 문구
· 최근 1~2년 기사 제목 + 날짜 + 한 줄 요약
· 보도자료에서 발표한 신규 사업 · 전략
· 대표 인터뷰에서 언급된 방향성`;

const ANALYSIS_PLACEHOLDER = `아직 비어 있습니다.

오른쪽 '기업 분석 리포트 만들기' 프롬프트를 복사해서
Claude 채팅창에 붙여넣고, 받은 답변 전체를 여기에 붙여넣으세요.

이 칸을 채우면 나머지 5개 프롬프트가 모두 활성화됩니다.`;

export function MaterialForm({ context, onChange }: MaterialFormProps) {
  const materialCount = context.collectedMaterial.trim().length;
  const analysisCount = context.companyAnalysis.trim().length;

  return (
    <div className="space-y-5">
      <Alert tone="info">
        이 두 칸이 이 도구의 핵심입니다. <strong>①</strong> 검색해서 모은 원본 자료를 위 칸에,
        <strong> ②</strong> Claude가 정리해 준 분석 결과를 아래 칸에 넣으세요.
      </Alert>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="collectedMaterial" className="flex items-center gap-1.5">
            <ClipboardPaste className="h-3.5 w-3.5 text-primary" />① 수집한 자료
          </Label>
          <CharCount count={materialCount} good={300} />
        </div>
        <Textarea
          id="collectedMaterial"
          rows={14}
          placeholder={MATERIAL_PLACEHOLDER}
          className="text-[13px] leading-relaxed"
          value={context.collectedMaterial}
          onChange={(event) => onChange({ collectedMaterial: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          많을수록 좋습니다. 최소 300자 이상 모으면 분석 품질이 확 올라갑니다.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="companyAnalysis" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />② 기업 분석 결과
          </Label>
          <CharCount count={analysisCount} good={500} />
        </div>
        <Textarea
          id="companyAnalysis"
          rows={12}
          placeholder={ANALYSIS_PLACEHOLDER}
          className="text-[13px] leading-relaxed"
          value={context.companyAnalysis}
          onChange={(event) => onChange({ companyAnalysis: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Claude가 준 답변을 <strong>통째로</strong> 붙여넣으세요. 요약하지 마세요.
        </p>
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
          ? "text-[11px] font-medium text-emerald-700"
          : "text-[11px] text-muted-foreground"
      }
    >
      {count.toLocaleString()}자{enough ? " ✓" : ""}
    </span>
  );
}
