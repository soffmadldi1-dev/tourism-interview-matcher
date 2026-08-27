"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  Copy,
  CornerDownRight,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  Gift,
  Lock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STAGE_META,
  missingFields,
  templatesByStage,
  type PromptStage,
  type PromptTemplate,
} from "@/lib/prompt-templates";
import { copyToClipboard } from "@/lib/export";
import type { PromptContext } from "@/lib/types";
import { cn } from "@/lib/utils";

const CLAUDE_URL = "https://claude.ai/new";

export function StagePrompts({
  stage,
  context,
}: {
  stage: PromptStage;
  context: PromptContext;
}) {
  const templates = templatesByStage(stage);
  const meta = STAGE_META[stage];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-sm font-bold">{meta.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {meta.description}
        </p>
      </div>

      {templates.map((template) => (
        <PromptCard key={template.id} template={template} context={context} />
      ))}
    </div>
  );
}

function PromptCard({
  template,
  context,
}: {
  template: PromptTemplate;
  context: PromptContext;
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const missing = missingFields(template, context);
  const ready = missing.length === 0;
  const prompt = React.useMemo(() => template.build(context), [template, context]);

  React.useEffect(() => {
    if (!copied && !failed) return;
    const timer = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [copied, failed]);

  async function handleCopy() {
    const succeeded = await copyToClipboard(prompt);
    if (succeeded) setCopied(true);
    else setFailed(true);
  }

  return (
    <Card className={cn("print-block", !ready && "border-dashed")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start gap-2 text-[15px] leading-snug">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
              ready
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {template.order}
          </span>
          {template.title}
        </CardTitle>

        {/* 무엇을 받게 되는지 */}
        <div className="flex items-start gap-1.5 pl-7 pt-1">
          <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-xs font-medium leading-relaxed text-foreground/80">
            {template.outcome}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 pl-7 pt-1.5">
          {template.producesHtml ? (
            <Badge variant="default">
              <FileCode2 className="h-3 w-3" />
              HTML 파일 도출
            </Badge>
          ) : (
            <Badge variant="outline">채팅 화면으로 도출</Badge>
          )}
          {template.sameChat ? (
            <Badge variant="warning">
              <CornerDownRight className="h-3 w-3" />
              같은 대화창에서 이어서
            </Badge>
          ) : null}
        </div>

        <p className="pl-7 pt-1 text-xs leading-relaxed text-muted-foreground">
          {template.when}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {!ready ? (
          <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              왼쪽에서 <strong className="text-foreground">{missing.join(", ")}</strong>을(를)
              먼저 채워 주세요.
            </span>
          </div>
        ) : null}

        <div className="no-print flex flex-wrap gap-2">
          <Button size="sm" onClick={handleCopy} variant={ready ? "default" : "outline"}>
            {copied ? <Check /> : <Copy />}
            {failed ? "복사 실패" : copied ? "복사됨!" : "프롬프트 복사"}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={CLAUDE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              Claude 열기
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen((prev) => !prev)}>
            {open ? <EyeOff /> : <Eye />}
            {open ? "접기" : "내용 보기"}
          </Button>
        </div>

        {copied ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <ArrowRight className="h-3.5 w-3.5" />
            Claude 채팅창에 붙여넣고 Enter를 누르세요.
          </p>
        ) : null}

        {open ? (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/50 p-3 text-[12px] leading-relaxed text-foreground/90">
            {prompt}
          </pre>
        ) : null}

        <div className="flex items-start gap-2 rounded-md bg-accent/50 p-2.5">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
          <p className="text-xs leading-relaxed text-accent-foreground">
            <strong>결과를 받은 뒤</strong> — {template.nextStep}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
