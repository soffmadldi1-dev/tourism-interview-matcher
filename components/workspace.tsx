"use client";

import * as React from "react";
import {
  Compass,
  Download,
  FileText,
  Printer,
  RotateCcw,
  Sparkles,
  UserRound,
} from "lucide-react";

import { CandidateForm } from "@/components/candidate-form";
import { CompanyForm } from "@/components/company-form";
import { CompanyIntelReport } from "@/components/company-intel-report";
import { StoryReport } from "@/components/story-report";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, Skeleton } from "@/components/ui/feedback";
import {
  downloadMarkdown,
  fullReportToMarkdown,
  printToPdf,
  safeFilename,
} from "@/lib/export";
import type {
  ApiResult,
  CandidateProfileInput,
  CompanyIntel,
  CompanySearchInput,
  StepStatus,
  StoryPackage,
} from "@/lib/types";

const COMPANY_LOADING_STEPS = [
  "웹에서 최신 기업 정보를 검색하고 있습니다…",
  "보도자료와 채용공고에서 핵심 근거를 추리고 있습니다…",
  "면접관 관점의 평가 키워드를 뽑고 있습니다…",
  "분석 결과를 구조화하고 있습니다…",
];

const STORY_LOADING_STEPS = [
  "기업이 지금 필요로 하는 역량을 정리하고 있습니다…",
  "당신의 경험과 1:1로 교차 매칭하고 있습니다…",
  "STAR 구조로 답변을 설계하고 있습니다…",
  "꼬리질문과 방어 논리를 만들고 있습니다…",
];

export function Workspace() {
  const [tab, setTab] = React.useState<"company" | "candidate">("company");

  const [companyStatus, setCompanyStatus] = React.useState<StepStatus>("idle");
  const [storyStatus, setStoryStatus] = React.useState<StepStatus>("idle");

  const [intel, setIntel] = React.useState<CompanyIntel | null>(null);
  const [story, setStory] = React.useState<StoryPackage | null>(null);
  const [candidate, setCandidate] = React.useState<CandidateProfileInput | null>(null);

  const [companyError, setCompanyError] = React.useState<string | null>(null);
  const [companyHint, setCompanyHint] = React.useState<string | undefined>();
  const [storyError, setStoryError] = React.useState<string | null>(null);
  const [storyHint, setStoryHint] = React.useState<string | undefined>();

  const reportRef = React.useRef<HTMLDivElement>(null);

  /* ── Step 1 ─────────────────────────────────────────────── */
  async function handleCompanySubmit(values: CompanySearchInput) {
    setCompanyStatus("loading");
    setCompanyError(null);
    setCompanyHint(undefined);
    setIntel(null);
    setStory(null);
    setStoryStatus("idle");
    reportRef.current?.scrollTo({ top: 0 });

    try {
      const response = await fetch("/api/company-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as ApiResult<CompanyIntel>;

      if (!result.ok) {
        setCompanyStatus("error");
        setCompanyError(result.error.message);
        setCompanyHint(result.error.hint);
        return;
      }

      setIntel(result.data);
      setCompanyStatus("done");
      setTab("candidate");
    } catch (err) {
      setCompanyStatus("error");
      setCompanyError(
        err instanceof Error ? err.message : "요청 중 알 수 없는 오류가 발생했습니다.",
      );
      setCompanyHint("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    }
  }

  /* ── Step 3 ─────────────────────────────────────────────── */
  async function handleCandidateSubmit(values: CandidateProfileInput) {
    if (!intel) return;

    setStoryStatus("loading");
    setStoryError(null);
    setStoryHint(undefined);
    setStory(null);
    setCandidate(values);

    try {
      // 서버 스키마에 없는 필드(sector, retrieval)는 제외하고 전송합니다.
      const { sector, retrieval: _retrieval, ...companyIntel } = intel;

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIntel, sector, candidate: values }),
      });
      const result = (await response.json()) as ApiResult<StoryPackage>;

      if (!result.ok) {
        setStoryStatus("error");
        setStoryError(result.error.message);
        setStoryHint(result.error.hint);
        return;
      }

      setStory(result.data);
      setStoryStatus("done");
    } catch (err) {
      setStoryStatus("error");
      setStoryError(
        err instanceof Error ? err.message : "요청 중 알 수 없는 오류가 발생했습니다.",
      );
      setStoryHint("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    }
  }

  function handleDownload() {
    if (!intel) return;
    downloadMarkdown(
      safeFilename(intel.companyName, intel.jobTitle, "면접스토리"),
      fullReportToMarkdown(intel, story, candidate),
    );
  }

  function handleReset() {
    setIntel(null);
    setStory(null);
    setCandidate(null);
    setCompanyStatus("idle");
    setStoryStatus("idle");
    setCompanyError(null);
    setStoryError(null);
    setTab("company");
  }

  const busy = companyStatus === "loading" || storyStatus === "loading";

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1600px] flex-col lg:h-[100dvh]">
      <Header onReset={handleReset} hasResult={Boolean(intel)} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(380px,440px)_1fr]">
        {/* ── 좌측: 입력 ─────────────────────────────────── */}
        <aside className="scroll-area no-print border-b border-border bg-card px-5 py-5 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
            <TabsList>
              <TabsTrigger value="company">
                <Compass className="h-4 w-4" />
                1. 기업 분석
              </TabsTrigger>
              <TabsTrigger value="candidate" disabled={!intel}>
                <UserRound className="h-4 w-4" />
                2. 내 프로필
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <CompanyForm
                onSubmit={handleCompanySubmit}
                isLoading={companyStatus === "loading"}
              />
            </TabsContent>

            <TabsContent value="candidate">
              <CandidateForm
                sector={intel?.sector ?? "hotel"}
                onSubmit={handleCandidateSubmit}
                isLoading={storyStatus === "loading"}
                disabled={!intel}
              />
            </TabsContent>
          </Tabs>
        </aside>

        {/* ── 우측: 리포트 ───────────────────────────────── */}
        <main
          ref={reportRef}
          className="scroll-area print-area bg-background px-5 py-5 lg:min-h-0 lg:overflow-y-auto"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {/* 내보내기 툴바 */}
            {intel ? (
              <div className="no-print flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download />
                  마크다운 저장
                </Button>
                <Button variant="outline" size="sm" onClick={printToPdf}>
                  <Printer />
                  PDF로 저장
                </Button>
              </div>
            ) : null}

            {/* Step 1 영역 */}
            {companyStatus === "idle" && !intel ? <EmptyState /> : null}

            {companyStatus === "loading" ? (
              <LoadingPanel title="기업 분석 중" steps={COMPANY_LOADING_STEPS} />
            ) : null}

            {companyStatus === "error" && companyError ? (
              <Alert tone="error" title="기업 분석에 실패했습니다">
                <p>{companyError}</p>
                {companyHint ? <p className="mt-1 opacity-80">{companyHint}</p> : null}
              </Alert>
            ) : null}

            {intel ? <CompanyIntelReport intel={intel} /> : null}

            {/* Step 3 영역 */}
            {storyStatus === "loading" ? (
              <LoadingPanel title="면접 스토리 생성 중" steps={STORY_LOADING_STEPS} />
            ) : null}

            {storyStatus === "error" && storyError ? (
              <Alert tone="error" title="스토리 생성에 실패했습니다">
                <p>{storyError}</p>
                {storyHint ? <p className="mt-1 opacity-80">{storyHint}</p> : null}
              </Alert>
            ) : null}

            {story && intel && candidate ? (
              <StoryReport story={story} intel={intel} candidate={candidate} />
            ) : null}

            {intel && !story && storyStatus === "idle" ? (
              <Alert tone="info" title="다음 단계">
                왼쪽 <strong>2. 내 프로필</strong> 탭에서 강점과 경험을 입력하면, 위 분석
                결과와 1:1로 매칭한 면접 답변을 만들어 드립니다.
              </Alert>
            ) : null}

            {intel ? <Disclaimer /> : null}
          </div>
        </main>
      </div>

      {busy ? <span className="sr-only" role="status">생성 중입니다</span> : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * 하위 프레젠테이션 컴포넌트
 * ──────────────────────────────────────────────────────────── */

function Header({ onReset, hasResult }: { onReset: () => void; hasResult: boolean }) {
  return (
    <header className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 lg:static">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">관광 면접 스토리 매처</h1>
          <p className="text-xs text-muted-foreground">
            기업 현안 × 내 경험 = 면접에서 통하는 답변
          </p>
        </div>
      </div>
      {hasResult ? (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          새로 시작
        </Button>
      ) : null}
    </header>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold">기업 조사부터 시작하세요</h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          홈페이지 인재상만 외워 가면 면접에서 밀립니다. 기업의 <strong>최근 전략과
          현안</strong>을 먼저 파악하고, 거기에 내 경험을 붙이는 순서로 준비하세요.
        </p>
      </div>
      <ul className="w-full max-w-md space-y-2 text-left">
        {[
          { step: "01", text: "업종 프리셋을 고르고 기업명·직무를 입력합니다." },
          { step: "02", text: "실시간 웹 검색으로 최신 현안과 평가 키워드를 뽑습니다." },
          { step: "03", text: "내 강점·경험을 입력해 1:1 매칭 답변을 생성합니다." },
        ].map((item) => (
          <li
            key={item.step}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
          >
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
              {item.step}
            </span>
            <span className="text-sm text-foreground/80">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingPanel({ title, steps }: { title: string; steps: string[] }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(
      () => setIndex((current) => Math.min(current + 1, steps.length - 1)),
      6000,
    );
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <FileText className="h-4 w-4 animate-pulse text-primary" />
        <p className="text-sm font-semibold">{title}</p>
      </div>

      <ol className="space-y-1.5">
        {steps.map((step, stepIndex) => (
          <li
            key={step}
            className={
              stepIndex <= index
                ? "flex items-center gap-2 text-sm text-foreground"
                : "flex items-center gap-2 text-sm text-muted-foreground/50"
            }
          >
            <span
              className={
                stepIndex < index
                  ? "h-1.5 w-1.5 rounded-full bg-primary"
                  : stepIndex === index
                    ? "h-1.5 w-1.5 animate-ping rounded-full bg-primary"
                    : "h-1.5 w-1.5 rounded-full bg-border"
              }
            />
            {step}
          </li>
        ))}
      </ol>

      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-24 w-full" />
      </div>

      <p className="text-xs text-muted-foreground">
        웹 검색과 분석을 함께 수행하므로 30초~2분 정도 걸릴 수 있습니다.
      </p>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="pb-6 pt-2 text-center text-xs leading-relaxed text-muted-foreground">
      AI가 생성한 초안입니다. 기업 정보는 공식 홈페이지·채용공고에서, 본인 경험은 실제
      사실 여부를 반드시 직접 확인한 뒤 사용하세요.
    </p>
  );
}
