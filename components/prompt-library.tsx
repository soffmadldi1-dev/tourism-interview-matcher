"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  Link2,
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
  const [linkCopied, setLinkCopied] = React.useState(false);

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

  React.useEffect(() => {
    if (!linkCopied) return;
    const timer = setTimeout(() => setLinkCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [linkCopied]);

  async function handleCopy() {
    const succeeded = await copyToClipboard(prompt);
    if (succeeded) setCopied(true);
    else setFailed(true);
  }

  async function handleCopyLink() {
    if (await copyToClipboard(CLAUDE_URL)) setLinkCopied(true);
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
          {template.producesHtml ? (
            <Badge variant="secondary" className="mt-0.5 shrink-0">
              <FileCode2 className="h-3 w-3" />
              HTML 파일
            </Badge>
          ) : null}
        </CardTitle>
        <p className="pl-7 text-xs leading-relaxed text-muted-foreground">{template.when}</p>
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
          <Button size="sm" variant="ghost" onClick={handleCopyLink} title="claude.ai 주소 복사">
            {linkCopied ? <Check className="text-emerald-600" /> : <Link2 />}
            {linkCopied ? "복사됨!" : "주소 복사"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen((prev) => !prev)}>
            {open ? <EyeOff /> : <Eye />}
            {open ? "접기" : "내용 보기"}
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          &lsquo;Claude 열기&rsquo;를 눌렀는데 <strong>데스크탑 앱</strong>이 열린다면, &lsquo;주소
          복사&rsquo;로 링크를 복사해 평소 쓰는 <strong>웹 브라우저 새 탭</strong> 주소창에
          붙여넣으세요. 설치 없이 그대로 접속됩니다.
        </p>

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
