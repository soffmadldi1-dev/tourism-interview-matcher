"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Building2, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTOR_PRESETS } from "@/lib/presets";
import { companySearchInputSchema } from "@/lib/schemas";
import type { CompanySearchInput, TourismSector } from "@/lib/types";
import { cn } from "@/lib/utils";

type FormValues = z.input<typeof companySearchInputSchema>;

interface CompanyFormProps {
  onSubmit: (values: CompanySearchInput) => void;
  isLoading: boolean;
}

export function CompanyForm({ onSubmit, isLoading }: CompanyFormProps) {
  const form = useForm<FormValues, unknown, CompanySearchInput>({
    resolver: zodResolver(companySearchInputSchema),
    defaultValues: { companyName: "", jobTitle: "", sector: "hotel", extraContext: "" },
    mode: "onSubmit",
  });

  const sector = form.watch("sector") as TourismSector;
  const preset = SECTOR_PRESETS.find((item) => item.key === sector) ?? SECTOR_PRESETS[0];
  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* 업종 프리셋 */}
      <div className="space-y-2">
        <Label>관광 업종 프리셋</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SECTOR_PRESETS.map((item) => {
            const active = item.key === sector;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => form.setValue("sector", item.key, { shouldValidate: true })}
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

      {/* 기업명 */}
      <div className="space-y-2">
        <Label htmlFor="companyName">기업 · 기관명</Label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="companyName"
            placeholder="예: 하나투어"
            className="pl-9"
            aria-invalid={Boolean(errors.companyName)}
            {...form.register("companyName")}
          />
        </div>
        <ChipRow
          items={preset.sampleCompanies}
          onPick={(value) => form.setValue("companyName", value, { shouldValidate: true })}
        />
        <FieldError message={errors.companyName?.message} />
      </div>

      {/* 지원 직무 */}
      <div className="space-y-2">
        <Label htmlFor="jobTitle">지원 직무</Label>
        <Input
          id="jobTitle"
          placeholder="예: 상품기획(MD)"
          aria-invalid={Boolean(errors.jobTitle)}
          {...form.register("jobTitle")}
        />
        <ChipRow
          items={preset.sampleJobs}
          onPick={(value) => form.setValue("jobTitle", value, { shouldValidate: true })}
        />
        <FieldError message={errors.jobTitle?.message} />
      </div>

      {/* 추가 정보 */}
      <div className="space-y-2">
        <Label htmlFor="extraContext">
          채용공고 발췌 · 참고 정보 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Textarea
          id="extraContext"
          rows={4}
          placeholder={
            "채용공고의 자격요건/우대사항을 붙여넣으면 분석 정확도가 크게 올라갑니다.\n예) 자격요건: 여행상품 기획 경력 2년 이상, 동남아 지역 소싱 경험 우대"
          }
          {...form.register("extraContext")}
        />
        <FieldError message={errors.extraContext?.message} />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            기업 정보를 수집하는 중…
          </>
        ) : (
          <>
            <Search />
            기업 분석 시작
          </>
        )}
      </Button>
    </form>
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
