"use client";

import * as React from "react";
import {
  Building2,
  ClipboardPaste,
  Compass,
  Download,
  FileUser,
  MessagesSquare,
  Presentation,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";

import { CompanyForm } from "@/components/company-form";
import { ContactFooter } from "@/components/contact-footer";
import { MaterialForm } from "@/components/material-form";
import { ProfileForm } from "@/components/profile-form";
import { StagePrompts } from "@/components/prompt-library";
import { SearchLauncher } from "@/components/search-launcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/feedback";
import { buildWorkbook, downloadMarkdown, safeFilename } from "@/lib/export";
import { clearContext, loadContext, saveContext } from "@/lib/storage";
import {
  EMPTY_CONTEXT,
  type InputStep,
  type OutputStep,
  type PromptContext,
} from "@/lib/types";

export function Workspace() {
  const [context, setContext] = React.useState<PromptContext>(EMPTY_CONTEXT);
  const [inputStep, setInputStep] = React.useState<InputStep>("company");
  const [outputStep, setOutputStep] = React.useState<OutputStep>("search");
  const [restored, setRestored] = React.useState(false);

  React.useEffect(() => {
    setContext(loadContext());
    setRestored(true);
  }, []);

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
    setInputStep("company");
    setOutputStep("search");
  }

  function handleDownload() {
    downloadMarkdown(
      safeFilename(context.companyName || "기업", context.jobTitle, "취업준비_워크북"),
      buildWorkbook(context),
    );
  }

  const hasCompany = context.companyName.trim().length >= 2;
  const hasAnything = Boolean(
    context.companyName || context.collectedMaterial || context.resumeText,
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1320px] flex-col lg:h-[100dvh]">
      <Header onReset={handleReset} showReset={hasAnything} context={context} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(420px,470px)_minmax(0,1fr)]">
        {/* ── 좌측: 입력 ─────────────────────────────────── */}
        <aside className="scroll-area no-print border-b border-border bg-card px-5 py-5 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            여기에 정보를 입력하세요
          </p>

          <Tabs
            value={inputStep}
            onValueChange={(value) => setInputStep(value as InputStep)}
          >
            <TabsList>
              <TabsTrigger value="company">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">①&nbsp;</span>기업 정보
              </TabsTrigger>
              <TabsTrigger value="material">
                <ClipboardPaste className="h-4 w-4" />
                <span className="hidden sm:inline">②&nbsp;</span>조사 자료
              </TabsTrigger>
              <TabsTrigger value="profile">
                <FileUser className="h-4 w-4" />
                <span className="hidden sm:inline">③&nbsp;</span>내 서류
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <StepIntro
                title="어느 회사에 지원하나요?"
                body="입력하면 오른쪽에 그 회사를 조사할 검색 링크가 바로 만들어집니다."
              />
              <CompanyForm context={context} onChange={update} />
            </TabsContent>

            <TabsContent value="material">
              <StepIntro
                title="찾은 회사 정보를 여기에 모으세요"
                body="오른쪽 '자료 찾기' 탭의 링크에서 복사해 온 내용을 붙여넣는 곳입니다."
              />
              <MaterialForm context={context} onChange={update} />
            </TabsContent>

            <TabsContent value="profile">
              <StepIntro
                title="내 이력서와 자기소개서를 넣으세요"
                body="수업에서 만든 서류를 그대로 붙여넣으면 됩니다."
              />
              <ProfileForm context={context} onChange={update} />
            </TabsContent>
          </Tabs>
        </aside>

        {/* ── 우측: 결과 ─────────────────────────────────── */}
        <main className="scroll-area print-area bg-background px-5 py-5 lg:min-h-0 lg:overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-4">
            {!hasCompany ? (
              <>
                <HowToUse />
                <ContactFooter />
              </>
            ) : (
              <>
                <div className="no-print flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    순서대로 진행하세요
                  </p>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download />
                    전체 워크북 저장
                  </Button>
                </div>

                <Tabs
                  value={outputStep}
                  onValueChange={(value) => setOutputStep(value as OutputStep)}
                >
                  <TabsList>
                    <TabsTrigger value="search">
                      <Search className="h-4 w-4" />
                      자료 찾기
                    </TabsTrigger>
                    <TabsTrigger value="analyze">
                      <Compass className="h-4 w-4" />
                      <span className="hidden sm:inline">1단계&nbsp;</span>기업 분석
                    </TabsTrigger>
                    <TabsTrigger value="document">
                      <FileUser className="h-4 w-4" />
                      <span className="hidden sm:inline">2단계&nbsp;</span>서류 매칭
                    </TabsTrigger>
                    <TabsTrigger value="interview">
                      <MessagesSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">3단계&nbsp;</span>면접 준비
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="search">
                    <SearchLauncher
                      companyName={context.companyName}
                      jobTitle={context.jobTitle}
                      sector={context.sector}
                      homepageUrl={context.homepageUrl}
                    />
                  </TabsContent>

                  <TabsContent value="analyze">
                    <StagePrompts stage="analyze" context={context} />
                  </TabsContent>

                  <TabsContent value="document">
                    <StagePrompts stage="document" context={context} />
                  </TabsContent>

                  <TabsContent value="interview">
                    <StagePrompts stage="interview" context={context} />
                  </TabsContent>
                </Tabs>

                <Alert tone="warning" className="print-block">
                  AI가 만든 결과는 <strong>초안</strong>입니다. 회사 정보는 공식 홈페이지·채용공고에서,
                  본인 경험은 실제 사실인지 반드시 직접 확인한 뒤 사용하세요. 확인되지 않은 성과를
                  면접에서 말하는 것이 가장 큰 위험입니다.
                </Alert>

                <ContactFooter />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * 하위 컴포넌트
 * ──────────────────────────────────────────────────────────── */

function StepIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

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
          <h1 className="text-sm font-bold leading-tight">관광 취업 프롬프트 메이커</h1>
          <p className="text-xs text-muted-foreground">
            {context.companyName
              ? `${context.companyName} ${context.jobTitle}`.trim()
              : "기업 조사 → 서류 매칭 → 면접 준비"}
          </p>
        </div>
      </div>
      {showReset ? (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw />
          <span className="hidden sm:inline">새로 시작</span>
        </Button>
      ) : null}
    </header>
  );
}

const STEPS = [
  {
    num: "01",
    icon: Building2,
    title: "지원할 회사를 입력합니다",
    body: "왼쪽 '① 기업 정보' 탭에서 업종을 고르고 회사명·직무를 넣으세요. 홈페이지 주소까지 넣으면 더 정확한 검색 링크가 생깁니다.",
  },
  {
    num: "02",
    icon: Search,
    title: "링크를 열어 회사 정보를 모읍니다",
    body: "오른쪽에 검색 링크가 나타납니다. 열어서 채용공고·인재상·최근 뉴스를 읽고, 쓸 만한 내용을 복사해 '② 조사 자료' 탭에 붙여넣으세요.",
  },
  {
    num: "03",
    icon: Presentation,
    title: "프롬프트를 복사해 Claude에 붙여넣습니다",
    body: "복사 버튼만 누르면 완성된 질문이 만들어집니다. Claude 채팅창에 붙여넣고 Enter를 누르세요.",
  },
  {
    num: "04",
    icon: MessagesSquare,
    title: "받은 답변으로 다음 단계를 엽니다",
    body: "기업 분석 결과를 '② 조사 자료' 탭에 다시 붙여넣으면, 이력서·자기소개서·면접 프롬프트가 모두 열립니다.",
  },
];

function HowToUse() {
  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col items-center gap-4 pt-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">왼쪽에 지원할 회사를 입력해 보세요</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            홈페이지 인재상만 외워 가면 면접에서 밀립니다. 회사의{" "}
            <strong className="text-foreground">최근 전략과 현재 상황</strong>을 먼저 파악하고,
            거기에 내 경험을 붙이는 순서로 준비하세요.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold">
          <span className="rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            사용 방법
          </span>
          4단계로 끝납니다
        </p>

        <ol className="space-y-2.5">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.num} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">
                    <span className="text-primary">{item.num}.</span> {item.title}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <Alert tone="info">
        <strong>준비물은 두 가지입니다.</strong> 지원할 회사 이름, 그리고 수업에서 만든
        이력서·자기소개서. 없어도 시작할 수 있습니다.
      </Alert>

      <p className="text-center text-xs text-muted-foreground">
        입력한 내용은 이 브라우저에만 저장됩니다. 서버로 전송되지 않으니 안심하고 쓰세요.
      </p>
    </div>
  );
}
