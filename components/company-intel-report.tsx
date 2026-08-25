"use client";

import {
  Briefcase,
  CalendarClock,
  ExternalLink,
  Lightbulb,
  Radar,
  ShieldAlert,
  Target,
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
import { companyIntelToMarkdown } from "@/lib/export";
import { PROVIDER_LABEL, SECTOR_MAP } from "@/lib/presets";
import type { CompanyIntel } from "@/lib/types";

const CONFIDENCE_META = {
  high: { label: "신뢰도 높음", variant: "success" as const },
  medium: { label: "신뢰도 보통", variant: "warning" as const },
  low: { label: "신뢰도 낮음 · 교차 확인 필요", variant: "danger" as const },
};

export function CompanyIntelReport({ intel }: { intel: CompanyIntel }) {
  const confidence = CONFIDENCE_META[intel.confidence];
  const sectorLabel = SECTOR_MAP[intel.sector]?.label ?? "기타";

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <Card className="print-block border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-xl">{intel.companyName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {sectorLabel} · 지원 직무 <strong>{intel.jobTitle}</strong>
              </p>
            </div>
            <CopyButton
              value={() => companyIntelToMarkdown(intel)}
              label="분석 전체 복사"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant={confidence.variant}>{confidence.label}</Badge>
            <Badge variant="outline">
              <Radar className="h-3 w-3" />
              {PROVIDER_LABEL[intel.retrieval.provider]}
              {intel.retrieval.resultCount > 0
                ? ` · 근거 ${intel.retrieval.resultCount}건`
                : ""}
            </Badge>
            <Badge variant="outline">
              <CalendarClock className="h-3 w-3" />
              기준 {intel.dataAsOf}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="prose-report">{intel.overview}</p>
          {intel.retrieval.notice ? (
            <Alert
              tone={intel.retrieval.provider === "none" ? "warning" : "info"}
              title="검색 경로 안내"
            >
              {intel.retrieval.notice}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {/* 상세 섹션 */}
      <Card className="print-block">
        <CardContent className="pt-2">
          <Accordion
            type="multiple"
            defaultValue={["identity", "business", "keywords"]}
          >
            {/* 미션·비전·인재상 */}
            <AccordionItem value="identity">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  미션 · 비전 · 인재상
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBox label="미션" value={intel.identity.mission} />
                  <InfoBox label="비전" value={intel.identity.vision} />
                </div>
                <div className="space-y-2">
                  <p className="field-label">인재상 해석</p>
                  <ul className="space-y-2">
                    {intel.identity.talentProfile.map((item) => (
                      <li
                        key={item.keyword}
                        className="rounded-lg border border-border bg-muted/40 p-3"
                      >
                        <p className="text-sm font-semibold text-primary">
                          {item.keyword}
                        </p>
                        <p className="prose-report mt-0.5">{item.interpretation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 사업 모델 */}
            <AccordionItem value="business">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  사업 모델 및 최근 신규 전략
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-1.5">
                  <p className="field-label">핵심 사업 모델</p>
                  <div className="flex flex-wrap gap-1.5">
                    {intel.business.coreModels.map((model) => (
                      <Badge key={model} variant="secondary">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="field-label">최근 1~2년 신규 전략</p>
                  {intel.business.newStrategies.map((strategy) => (
                    <div
                      key={strategy.title}
                      className="rounded-lg border-l-2 border-primary bg-muted/40 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{strategy.title}</p>
                        <Badge variant="outline">{strategy.timeframe}</Badge>
                      </div>
                      <p className="prose-report mt-1">{strategy.detail}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 최근 이슈 */}
            <AccordionItem value="issues">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  최근 이슈 · 보도자료 · 행사
                  <Badge variant="outline">{intel.recentIssues.length}건</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {intel.recentIssues.map((issue) => (
                  <div
                    key={`${issue.date}-${issue.title}`}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{issue.date}</Badge>
                      <Badge variant="secondary">{issue.category}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold">{issue.title}</p>
                    <p className="prose-report mt-1">{issue.summary}</p>
                    <p className="mt-2 flex gap-1.5 rounded-md bg-accent/60 p-2 text-xs text-accent-foreground">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>면접 활용각: {issue.interviewAngle}</span>
                    </p>
                    {issue.sourceUrl ? (
                      <a
                        href={issue.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        출처 열기
                      </a>
                    ) : null}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* 면접관 키워드 */}
            <AccordionItem value="keywords">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Radar className="h-4 w-4 text-primary" />
                  면접관 관점 핵심 평가 키워드
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {intel.interviewerKeywords.map((keyword) => (
                  <div
                    key={keyword.keyword}
                    className="rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <p className="text-sm font-semibold text-primary">
                      {keyword.keyword}
                    </p>
                    <p className="prose-report mt-0.5">{keyword.why}</p>
                    <p className="mt-2 border-l-2 border-primary/40 pl-2.5 text-sm italic text-foreground/80">
                      “{keyword.sampleQuestion}”
                    </p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* 주의 현안 */}
            {intel.watchOuts.length > 0 ? (
              <AccordionItem value="watchouts">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    말하기 전에 알아둘 현안
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5">
                    {intel.watchOuts.map((item) => (
                      <li key={item} className="prose-report flex gap-2">
                        <span className="text-amber-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {/* 출처 */}
            {intel.sources.length > 0 ? (
              <AccordionItem value="sources">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    참고 출처 <Badge variant="outline">{intel.sources.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5">
                    {intel.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="field-label">{label}</p>
      <p className="prose-report mt-1">{value || "확인되지 않음"}</p>
    </div>
  );
}
