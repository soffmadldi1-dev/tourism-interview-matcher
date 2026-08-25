"use client";

import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Mic,
  Rocket,
  ShieldQuestion,
  Timer,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { CopyButton } from "@/components/copy-button";
import { storyToMarkdown } from "@/lib/export";
import type { CandidateProfileInput, CompanyIntel, StoryPackage } from "@/lib/types";

const LEVEL_META = {
  strong: { label: "강함", variant: "success" as const },
  moderate: { label: "보통", variant: "warning" as const },
  gap: { label: "보완 필요", variant: "danger" as const },
};

interface StoryReportProps {
  story: StoryPackage;
  intel: CompanyIntel;
  candidate: CandidateProfileInput;
}

export function StoryReport({ story, intel, candidate }: StoryReportProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Mic className="h-5 w-5 text-primary" />
          면접 스토리 패키지
        </h2>
        <CopyButton
          value={() => storyToMarkdown(story, intel, candidate)}
          label="스토리 전체 복사"
        />
      </div>

      {/* 1분 자기소개 */}
      <Card className="print-block border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="field-label">01 · 맞춤형 1분 자기소개</p>
              <CardTitle className="mt-1.5 text-lg leading-snug">
                {story.oneMinutePitch.headline}
              </CardTitle>
            </div>
            <CopyButton value={story.oneMinutePitch.script} label="스크립트 복사" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="prose-report whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-[15px] leading-[1.9]">
            {story.oneMinutePitch.script}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <Timer className="h-3 w-3" />약 {story.oneMinutePitch.estimatedSeconds}초
            </Badge>
            <Badge variant="outline">{story.oneMinutePitch.script.length}자</Badge>
          </div>
          <div className="space-y-1.5">
            <p className="field-label">전달 팁</p>
            <ul className="space-y-1">
              {story.oneMinutePitch.deliveryTips.map((tip) => (
                <li key={tip} className="prose-report flex gap-2">
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 매칭 매트릭스 */}
      <Card className="print-block">
        <CardHeader className="pb-3">
          <p className="field-label">02 · 기업 니즈 ↔ 내 경험 교차 매칭</p>
          <CardTitle className="mt-1.5 flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            어디가 강하고 어디가 비었는지
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {story.matchMatrix.map((row) => {
            const meta = LEVEL_META[row.level];
            return (
              <div
                key={row.companyNeed}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{row.companyNeed}</p>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                <p className="prose-report mt-1.5">
                  <span className="field-label mr-1.5">내 근거</span>
                  {row.candidateEvidence}
                </p>
                <p className="mt-2 flex gap-1.5 rounded-md bg-accent/60 p-2 text-xs text-accent-foreground">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{row.bridge}</span>
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* STAR 답변 */}
      <Card className="print-block">
        <CardHeader className="pb-2">
          <p className="field-label">03 · 핵심 경험 매칭 답변 (STAR)</p>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="multiple" defaultValue={["star-0"]}>
            {story.starAnswers.map((answer, index) => (
              <AccordionItem key={answer.question} value={`star-${index}`}>
                <AccordionTrigger>
                  <span className="pr-2 text-left">
                    Q{index + 1}. {answer.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="rounded-md bg-accent/60 p-2 text-xs text-accent-foreground">
                    기업 연결점 · {answer.companyHook}
                  </p>
                  <StarRow label="S · 상황" value={answer.situation} />
                  <StarRow label="T · 과제" value={answer.task} />
                  <StarRow label="A · 행동" value={answer.action} highlight />
                  <StarRow label="R · 결과" value={answer.result} highlight />
                  {answer.metrics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {answer.metrics.map((metric) => (
                        <Badge key={metric} variant="success">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <p className="prose-report border-l-2 border-primary pl-3 font-medium">
                    {answer.bridgeToCompany}
                  </p>
                  <CopyButton
                    value={[
                      `Q. ${answer.question}`,
                      `S: ${answer.situation}`,
                      `T: ${answer.task}`,
                      `A: ${answer.action}`,
                      `R: ${answer.result}`,
                      answer.bridgeToCompany,
                    ].join("\n")}
                    label="이 답변만 복사"
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* 지원동기 */}
      <Card className="print-block">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="field-label">04 · 지원동기 및 입사 후 기여 방안</p>
              <CardTitle className="mt-1.5 flex items-center gap-2 text-base">
                <Rocket className="h-4 w-4 text-primary" />
                {intel.companyName}에서 무엇을 하겠는가
              </CardTitle>
            </div>
            <CopyButton value={story.motivation.script} label="스크립트 복사" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="prose-report whitespace-pre-wrap rounded-lg bg-muted/50 p-4 leading-[1.9]">
            {story.motivation.script}
          </p>
          <div className="space-y-2">
            <p className="field-label">입사 후 기여 로드맵</p>
            <div className="space-y-2">
              {story.motivation.contributionPlan.map((phase, index) => (
                <div
                  key={phase.phase}
                  className="rounded-lg border border-border bg-muted/40 p-3"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                      {index + 1}
                    </span>
                    {phase.phase}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {phase.actions.map((action) => (
                      <li key={action} className="prose-report flex gap-2">
                        <span className="text-primary">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 꼬리질문 */}
      <Card className="print-block">
        <CardHeader className="pb-2">
          <p className="field-label">05 · 예상 꼬리질문 및 방어 논리</p>
          <CardTitle className="mt-1.5 flex items-center gap-2 text-base">
            <ShieldQuestion className="h-4 w-4 text-primary" />
            가장 아픈 곳부터 대비하기
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {story.followUps.map((followUp, index) => (
            <div key={followUp.question} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">
                <span className="mr-1.5 text-muted-foreground">Q{index + 1}.</span>
                {followUp.question}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                면접관 의도 · {followUp.intent}
              </p>
              <p className="prose-report mt-2 border-l-2 border-primary/40 pl-3">
                <span className="field-label mr-1.5">방어 논리</span>
                {followUp.defense}
              </p>
              <p className="prose-report mt-2 rounded-md bg-muted/50 p-2.5">
                {followUp.sampleAnswer}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 주의사항 */}
      {story.cautions.length > 0 ? (
        <Alert tone="warning" title="사용 전 반드시 확인할 것" className="print-block">
          <ul className="space-y-1">
            {story.cautions.map((caution) => (
              <li key={caution} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {caution}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}
    </div>
  );
}

function StarRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-primary/25 bg-primary/5 p-2.5"
          : "rounded-lg bg-muted/40 p-2.5"
      }
    >
      <p className="field-label">{label}</p>
      <p className="prose-report mt-0.5">{value}</p>
    </div>
  );
}
