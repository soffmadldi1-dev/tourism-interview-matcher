"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2, Plus, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SECTOR_MAP, TONE_PRESETS } from "@/lib/presets";
import { candidateProfileSchema } from "@/lib/schemas";
import type { CandidateProfileInput, ToneKey, TourismSector } from "@/lib/types";

type FormValues = z.input<typeof candidateProfileSchema>;

interface CandidateFormProps {
  sector: TourismSector;
  onSubmit: (values: CandidateProfileInput) => void;
  isLoading: boolean;
  /** Step 1 기업 분석이 끝나기 전에는 비활성화 */
  disabled: boolean;
}

const EXPERIENCE_PLACEHOLDER = `한 줄에 하나씩, 사실 위주로 적어 주세요. 숫자가 있으면 반드시 포함하세요.

예)
- 2024.03~2025.02 ○○호텔 프론트 인턴 / 일 평균 체크인 60건 응대, 외국인 투숙객 비중 40%
- 2023 교내 관광 콘텐츠 공모전 대상 / 지역 소상공인 12곳 인터뷰 후 도보 코스 3개 기획
- 2022~2023 카페 아르바이트 18개월 / 피크타임 시간당 90잔 응대, 신입 3명 교육`;

export function CandidateForm({
  sector,
  onSubmit,
  isLoading,
  disabled,
}: CandidateFormProps) {
  const form = useForm<FormValues, unknown, CandidateProfileInput>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      strengthTags: [],
      strengthDetail: "",
      experiences: "",
      motivationDraft: "",
      tone: "calm",
    },
    mode: "onSubmit",
  });

  const [draftTag, setDraftTag] = React.useState("");
  const tags = (form.watch("strengthTags") ?? []) as string[];
  const tone = form.watch("tone") as ToneKey;
  const errors = form.formState.errors;
  const suggestions = SECTOR_MAP[sector]?.strengthSuggestions ?? [];

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 12) return;
    form.setValue("strengthTags", [...tags, trimmed], { shouldValidate: true });
    setDraftTag("");
  }

  function removeTag(value: string) {
    form.setValue(
      "strengthTags",
      tags.filter((tag) => tag !== value),
      { shouldValidate: true },
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      aria-disabled={disabled}
    >
      {/* 강점 태그 */}
      <div className="space-y-2">
        <Label htmlFor="strengthTag">핵심 강점 · 보유 역량</Label>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs font-medium text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`${tag} 삭제`}
                  className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Input
            id="strengthTag"
            value={draftTag}
            onChange={(event) => setDraftTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag(draftTag);
              }
            }}
            placeholder="직접 입력 후 Enter (예: 중국어 응대)"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addTag(draftTag)}
            disabled={disabled || !draftTag.trim()}
          >
            <Plus />
            추가
          </Button>
        </div>

        {suggestions.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">
              {SECTOR_MAP[sector].label}에서 자주 통하는 강점 — 눌러서 추가
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions
                .filter((item) => !tags.includes(item))
                .map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addTag(item)}
                    disabled={disabled}
                    className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    + {item}
                  </button>
                ))}
            </div>
          </div>
        ) : null}

        <FieldError message={errors.strengthTags?.message} />
      </div>

      {/* 강점 상세 */}
      <div className="space-y-2">
        <Label htmlFor="strengthDetail">
          강점 상세 기술 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Textarea
          id="strengthDetail"
          rows={3}
          disabled={disabled}
          placeholder="태그만으로 설명이 부족한 강점을 자유롭게 적어 주세요."
          {...form.register("strengthDetail")}
        />
        <FieldError message={errors.strengthDetail?.message} />
      </div>

      {/* 경험 */}
      <div className="space-y-2">
        <Label htmlFor="experiences">주요 이력 · 프로젝트 · 실무/아르바이트 경험</Label>
        <Textarea
          id="experiences"
          rows={10}
          disabled={disabled}
          placeholder={EXPERIENCE_PLACEHOLDER}
          aria-invalid={Boolean(errors.experiences)}
          className="font-[inherit] text-[13px] leading-relaxed"
          {...form.register("experiences")}
        />
        <FieldError message={errors.experiences?.message} />
      </div>

      {/* 지원동기 초안 */}
      <div className="space-y-2">
        <Label htmlFor="motivationDraft">
          지원동기 · 입사 후 포부 초안 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Textarea
          id="motivationDraft"
          rows={4}
          disabled={disabled}
          placeholder="이미 써 둔 초안이 있다면 붙여넣으세요. 기업 분석 결과에 맞춰 다시 설계해 드립니다."
          {...form.register("motivationDraft")}
        />
        <FieldError message={errors.motivationDraft?.message} />
      </div>

      {/* 톤앤매너 */}
      <div className="space-y-2">
        <Label>톤앤매너</Label>
        <ToggleGroup
          type="single"
          value={tone}
          onValueChange={(value) => {
            if (value) form.setValue("tone", value as ToneKey, { shouldValidate: true });
          }}
          disabled={disabled}
        >
          {TONE_PRESETS.map((item) => (
            <ToggleGroupItem key={item.key} value={item.key} aria-label={item.label}>
              <span className="font-semibold">{item.label}</span>
              <span className="text-[10px] opacity-70">{item.short}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Button type="submit" disabled={disabled || isLoading} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            면접 스토리를 설계하는 중…
          </>
        ) : (
          <>
            <Sparkles />
            면접 스토리 생성
          </>
        )}
      </Button>

      {disabled ? (
        <p className="text-center text-xs text-muted-foreground">
          먼저 <strong>기업 분석</strong>을 완료하면 입력할 수 있습니다.
        </p>
      ) : null}
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
