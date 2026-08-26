"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, FileUser, Lightbulb, MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TONE_PRESETS } from "@/lib/presets";
import { RECALL_PROMPT } from "@/lib/prompt-templates";
import { copyToClipboard } from "@/lib/export";
import type { PromptContext, ToneKey } from "@/lib/types";

interface ProfileFormProps {
  context: PromptContext;
  onChange: (patch: Partial<PromptContext>) => void;
}

const RESUME_PLACEHOLDER = `수업에서 만든 이력서를 그대로 붙여넣으세요.

경력, 학력, 자격증, 프로젝트, 아르바이트 경험 등
이력서에 있는 내용 전부를 넣으면 됩니다.`;

const COVER_LETTER_PLACEHOLDER = `수업에서 만든 자기소개서를 그대로 붙여넣으세요.

문항과 답변을 함께 넣으면 더 정확합니다.

예)
1. 지원 동기를 기술하시오. (800자)
→ 저는 ...`;

export function ProfileForm({ context, onChange }: ProfileFormProps) {
  return (
    <div className="space-y-4">
      <RecallHelper />

      {/* 이력서 */}
      <div className="space-y-2">
        <Label htmlFor="resumeText" className="flex items-center gap-1.5">
          <FileUser className="h-3.5 w-3.5 text-primary" />내 이력서
        </Label>
        <p className="text-xs text-muted-foreground">
          강점·경험은 이력서 안에 이미 있으니 따로 적지 않아도 됩니다.
        </p>
        <Textarea
          id="resumeText"
          rows={12}
          placeholder={RESUME_PLACEHOLDER}
          className="text-[13px] leading-relaxed"
          value={context.resumeText}
          onChange={(event) => onChange({ resumeText: event.target.value })}
        />
        <CharCount count={context.resumeText.trim().length} />
      </div>

      {/* 자기소개서 */}
      <div className="space-y-2">
        <Label htmlFor="coverLetterText" className="flex items-center gap-1.5">
          <MessageSquareText className="h-3.5 w-3.5 text-primary" />내 자기소개서
        </Label>
        <p className="text-xs text-muted-foreground">
          아직 없으면 비워 두세요. 이력서만으로도 면접 준비는 가능합니다.
        </p>
        <Textarea
          id="coverLetterText"
          rows={10}
          placeholder={COVER_LETTER_PLACEHOLDER}
          className="text-[13px] leading-relaxed"
          value={context.coverLetterText}
          onChange={(event) => onChange({ coverLetterText: event.target.value })}
        />
        <CharCount count={context.coverLetterText.trim().length} />
      </div>

      {/* 톤앤매너 */}
      <div className="space-y-2 border-t border-border pt-4">
        <Label>어떤 말투로 만들까요?</Label>
        <ToggleGroup
          type="single"
          value={context.tone}
          onValueChange={(value) => {
            if (value) onChange({ tone: value as ToneKey });
          }}
        >
          {TONE_PRESETS.map((item) => (
            <ToggleGroupItem key={item.key} value={item.key} aria-label={item.label}>
              <span className="font-semibold">{item.label}</span>
              <span className="text-[10px] opacity-70">{item.short}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}

/** 수업에서 만든 서류를 Claude 채팅 기록에서 꺼내오는 방법 안내 */
function RecallHelper() {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    if (await copyToClipboard(RECALL_PROMPT)) setCopied(true);
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        <Lightbulb className="h-4 w-4" />
        수업 때 만든 서류를 찾는 방법
      </p>

      <ol className="space-y-1 text-xs leading-relaxed text-foreground/80">
        <li>
          <strong>1.</strong> Claude에 접속해 <strong>왼쪽 대화 목록</strong>에서 수업 때 쓴 대화를
          찾습니다.
        </li>
        <li>
          <strong>2.</strong> 그 대화창에 아래 문장을 붙여넣습니다.
        </li>
        <li>
          <strong>3.</strong> 다시 출력된 이력서·자기소개서를 복사해 아래 칸에 넣습니다.
        </li>
      </ol>

      <p className="rounded-md border border-border bg-background p-2 text-[11.5px] leading-relaxed text-muted-foreground">
        {RECALL_PROMPT}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="text-emerald-600" /> : <Copy />}
          {copied ? "복사됨!" : "이 문장 복사"}
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <a href="https://claude.ai/recents" target="_blank" rel="noopener noreferrer">
            <ExternalLink />내 대화 목록 열기
          </a>
        </Button>
      </div>
    </div>
  );
}

function CharCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p className="text-right text-[11px] text-muted-foreground">
      {count.toLocaleString()}자
    </p>
  );
}
