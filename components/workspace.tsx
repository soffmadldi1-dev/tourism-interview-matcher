"use client";

import * as React from "react";
import {
  ClipboardPaste,
  Compass,
  Download,
  Printer,
  RotateCcw,
  Sparkles,
  UserRound,
} from "lucide-react";

import { CompanyForm } from "@/components/company-form";
import { MaterialForm } from "@/components/material-form";
import { ProfileForm } from "@/components/profile-form";
import { PromptLibrary, PromptReadiness } from "@/components/prompt-library";
import { SearchLauncher } from "@/components/search-launcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/feedback";
import { buildWorkbook, downloadMarkdown, printPage, safeFilename } from "@/lib/export";
import { clearContext, loadContext, saveContext } from "@/lib/storage";
import { EMPTY_CONTEXT, type InputStep, type PromptContext } from "@/lib/types";

export function Workspace() {
  const [context, setContext] = React.useState<PromptContext>(EMPTY_CONTEXT);
  const [step, setStep] = React.useState<InputStep>("company");
  const [restored, setRestored] = React.useState(false);

  /* 저장된 작업 복원 (첫 렌더 이후에만 — 서버/클라이언트 HTML 불일치 방지) */
  React.useEffect(() => {
    const saved = loadContext();
    setContext(saved);
    setRestored(true);
  }, []);

  /* 입력이 바뀔 때마다 자동 저장 */
  React.useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => saveContext(context), 400);
    return () => clearTimeout(timer);
  }, [context, restored]);

  const update = React.useCallback((patch: Partial<PromptContext>) => {
    setContext((prev) => ({ ...prev, ...patch }));
  }, []);

  function handleReset() {
    if (!window.confirm("입력한 내용을 모두 지웁니다. 계속할까요?")) return;
    clearContext();
    setContext(EMPTY_CONTEXT);
    setStep("company");
  }

  function handleDownload() {
    downloadMarkdown(
      safeFilename(context.companyName || "기업", context.jobTitle, "취업준비_워크북"),
      buildWorkbook(context),
    );
  }

  const hasCompany = context.companyName.trim().length >= 2;
  const hasAnything = Boolean(
    context.companyName || context.collectedMaterial || context.experiences,
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1320px] flex-col lg:h-[100dvh]">
      <Header onReset={handleReset} showReset={hasAnything} context={context} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(420px,480px)_minmax(0,1fr)]">
        {/* ── 좌측: 입력 ─────────────────────────────────── */}
        <aside className="scroll-area no-print border-b border-border bg-card px-5 py-5 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <Tabs value={step} onValueChange={(value) => setStep(value as InputStep)}>
            <TabsList>
              <TabsTrigger value="company">
                <Compass className="h-4 w-4" />
                1. 기업
              </TabsTrigger>
              <TabsTrigger value="material">
                <ClipboardPaste className="h-4 w-4" />
                2. 자료
              </TabsTrigger>
              <TabsTrigger value="profile">
                <UserRound className="h-4 w-4" />
                3. 나
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <CompanyForm context={context} onChange={update} />
            </TabsContent>

            <TabsContent value="material">
              <MaterialForm context={context} onChange={update} />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileForm context={context} onChange={update} />
            </TabsContent>
          </Tabs>
        </aside>

        {/* ── 우측: 결과 ─────────────────────────────────── */}
        <main className="scroll-area print-area bg-background px-5 py-5 lg:min-h-0 lg:overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-5">
            {hasCompany ? (
              <div className="no-print flex flex-wrap items-center justify-between gap-2">
                <PromptReadiness context={context} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download />
                    워크북 저장
                  </Button>
                  <Button variant="outline" size="sm" onClick={printPage}>
                    <Printer />
                    인쇄 · PDF
                  </Button>
                </div>
              </div>
            ) : null}

            {!hasCompany ? <HowToUse /> : null}

            {hasCompany ? (
              <>
                <SearchLauncher
                  companyName={context.companyName}
                  jobTitle={context.jobTitle}
                  sector={context.sector}
                  homepageUrl={context.homepageUrl}
                />

                <PromptLibrary context={context} />

                <Alert tone="warning" className="print-block">
                  AI가 만든 결과는 <strong>초안</strong>입니다. 기업 정보는 공식 홈페이지·채용공고에서,
                  본인 경험은 실제 사실 여부를 반드시 직접 확인한 뒤 사용하세요. 확인되지 않은 성과를
                  면접에서 말하는 것이 가장 큰 리스크입니다.
                </Alert>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * 하위 컴포넌트
 * ──────────────────────────────────────────────────────────── */

function Header({
  onReset,
  showReset,
  context,
}: {
  onReset: () => void;
  showReset: boolean;
  context: PromptContext;
}) {
  return (
    <header className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 lg:static">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">관광 취업 준비 워크벤치</h1>
          <p className="text-xs text-muted-foreground">
            {context.companyName
              ? `${context.companyName} ${context.jobTitle}`.trim()
              : "기업 조사 → 서류 맞춤화 → 면접 준비"}
          </p>
        </div>
      </div>
      {showReset ? (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          새로 시작
        </Button>
      ) : null}
    </header>
  );
}

const STEPS = [
  {
    num: "01",
    title: "기업 정보를 입력합니다",
    body: "업종을 고르고 기업명·직무를 넣으면, 그 회사를 조사할 검색 링크가 바로 만들어집니다.",
  },
  {
    num: "02",
    title: "링크를 열어 자료를 모읍니다",
    body: "새 탭에서 채용공고·인재상·최근 기사를 훑고, 쓸 만한 내용을 복사해 '2. 자료' 탭에 붙여넣습니다.",
  },
  {
    num: "03",
    title: "프롬프트를 복사해 Claude에 붙여넣습니다",
    body: "완성된 프롬프트가 자동으로 만들어집니다. 복사 버튼을 누르고 Claude 채팅창에 붙여넣기만 하면 됩니다.",
  },
  {
    num: "04",
    title: "받은 결과로 다음 단계를 진행합니다",
    body: "기업 분석 결과를 다시 붙여넣으면, 이력서·자소서·면접 스크립트 프롬프트가 모두 활성화됩니다.",
  },
];

function HowToUse() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">왼쪽에 기업명을 입력해 보세요</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            홈페이지 인재상만 외워 가면 면접에서 밀립니다. 기업의{" "}
            <strong className="text-foreground">최근 전략과 현안</strong>을 먼저 파악하고, 거기에 내
            경험을 붙이는 순서로 준비하세요.
          </p>
        </div>
      </div>

      <Alert tone="info">
        이 도구는 <strong>API 키도, 결제도 필요 없습니다.</strong> 검색 링크를 만들어 주고, 여러분이
        모은 자료로 <strong>완성된 프롬프트</strong>를 조립해 줍니다. 실제 분석은 무료로 쓸 수 있는{" "}
        <a
          href="https://claude.ai/new"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline underline-offset-2"
        >
          claude.ai
        </a>{" "}
        채팅창에서 하시면 됩니다.
      </Alert>

      <ol className="space-y-2">
        {STEPS.map((item) => (
          <li
            key={item.num}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5"
          >
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
              {item.num}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-foreground">
                {item.body}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="text-center text-xs text-muted-foreground">
        입력한 내용은 이 브라우저에만 저장됩니다. 서버로 전송되지 않으니 안심하고 쓰세요.
      </p>
    </div>
  );
}
