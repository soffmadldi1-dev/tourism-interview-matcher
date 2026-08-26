"use client";

import * as React from "react";
import { ArrowRight, Check, Copy, ExternalLink, Lock, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PROMPT_TEMPLATES,
  STAGE_META,
  missingFields,
  type PromptStage,
  type PromptTemplate,
} from "@/lib/prompt-templates";
import { copyToClipboard } from "@/lib/export";
import type { PromptContext } from "@/lib/types";
import { cn } from "@/lib/utils";

const CLAUDE_URL = "https://claude.ai/new";

const STAGE_ORDER: PromptStage[] = ["analyze", "document", "interview"];

export function PromptLibrary({ context }: { context: PromptContext }) {
  return (
    <div className="space-y-5">
      {STAGE_ORDER.map((stage) => {
        const templates = PROMPT_TEMPLATES.filter((t) => t.stage === stage).sort(
          (a, b) => a.order - b.order,
        );
        const meta = STAGE_META[stage];

        return (
          <section key={stage} className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">{meta.label}</h3>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>

            <div className="space-y-3">
              {templates.map((template) => (
                <PromptCard key={template.id} template={template} context={context} />
              ))}
            </div>
          </section>
        );
      })}
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
    }, 2000);
    return () => clearTimeout(timer);
  }, [copied, failed]);

  async function handleCopy() {
    const succeeded = await copyToClipboard(prompt);
    if (succeeded) setCopied(true);
    else setFailed(true);
  }

  return (
    <Card className={cn("print-block", !ready && "opacity-75")}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[15px] leading-snug">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {template.order}
              </span>
              {template.title}
            </CardTitle>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {template.when}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!ready ? (
          <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              먼저 왼쪽에서 <strong className="text-foreground">{missing.join(", ")}</strong>
              을(를) 채워 주세요. 지금 복사해도 빈칸 표시가 그대로 들어갑니다.
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
            <Wand2 />
            {open ? "내용 접기" : "내용 보기"}
          </Button>
        </div>

        {copied ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
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

/** 상단 요약 배지 — 몇 개 프롬프트가 준비됐는지 */
export function PromptReadiness({ context }: { context: PromptContext }) {
  const ready = PROMPT_TEMPLATES.filter(
    (template) => missingFields(template, context).length === 0,
  ).length;

  return (
    <Badge variant={ready === PROMPT_TEMPLATES.length ? "success" : "outline"}>
      프롬프트 {ready} / {PROMPT_TEMPLATES.length} 준비됨
    </Badge>
  );
}
