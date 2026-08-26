"use client";

import * as React from "react";
import { Building2, Globe } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTOR_PRESETS } from "@/lib/presets";
import { companyFormSchema } from "@/lib/schemas";
import type { PromptContext, TourismSector } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CompanyFormProps {
  context: PromptContext;
  onChange: (patch: Partial<PromptContext>) => void;
}

export function CompanyForm({ context, onChange }: CompanyFormProps) {
  const preset =
    SECTOR_PRESETS.find((item) => item.key === context.sector) ?? SECTOR_PRESETS[0];

  // 입력하는 즉시 검증하되, 아직 비어 있는 칸은 나무라지 않습니다.
  const issues = React.useMemo(() => {
    const result = companyFormSchema.safeParse(context);
    if (result.success) return {} as Record<string, string>;
    return Object.fromEntries(
      result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    );
  }, [context]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>관광 업종 프리셋</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SECTOR_PRESETS.map((item) => {
            const active = item.key === context.sector;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange({ sector: item.key as TourismSector })}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background hover:bg-accent",
                )}
              >
                <span className="text-sm font-semibold">
                  {item.emoji} {item.label}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{preset.lens}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">기업 · 기관명</Label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="companyName"
            placeholder="예: 하나투어"
            className="pl-9"
            value={context.companyName}
            onChange={(event) => onChange({ companyName: event.target.value })}
            aria-invalid={Boolean(context.companyName && issues.companyName)}
          />
        </div>
        <ChipRow
          items={preset.sampleCompanies}
          onPick={(value) => onChange({ companyName: value })}
        />
        {context.companyName && issues.companyName ? (
          <FieldError message={issues.companyName} />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">지원 직무</Label>
        <Input
          id="jobTitle"
          placeholder="예: 상품기획(MD)"
          value={context.jobTitle}
          onChange={(event) => onChange({ jobTitle: event.target.value })}
          aria-invalid={Boolean(context.jobTitle && issues.jobTitle)}
        />
        <ChipRow items={preset.sampleJobs} onPick={(value) => onChange({ jobTitle: value })} />
        {context.jobTitle && issues.jobTitle ? (
          <FieldError message={issues.jobTitle} />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="homepageUrl">
          기업 홈페이지 주소 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="homepageUrl"
            placeholder="예: hanatour.com"
            className="pl-9"
            value={context.homepageUrl}
            onChange={(event) => onChange({ homepageUrl: event.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          입력하면 <strong>홈페이지 안쪽 페이지까지</strong> 한 번에 훑는 검색 링크가 추가됩니다.
        </p>
      </div>
    </div>
  );
}

function ChipRow({ items, onPick }: { items: string[]; onPick: (value: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
