"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SECTOR_MAP, TONE_PRESETS } from "@/lib/presets";
import type { PromptContext, ToneKey } from "@/lib/types";

interface ProfileFormProps {
  context: PromptContext;
  onChange: (patch: Partial<PromptContext>) => void;
}

const EXPERIENCE_PLACEHOLDER = `한 줄에 하나씩, 사실 위주로 적으세요. 숫자가 있으면 반드시 넣으세요.

예)
- 2024.03~2025.02 ○○호텔 프론트 인턴 / 일 평균 체크인 60건 응대, 외국인 투숙객 40%
- 2023 교내 관광 콘텐츠 공모전 대상 / 소상공인 12곳 인터뷰 후 도보 코스 3개 기획
- 2022~2023 카페 아르바이트 18개월 / 피크타임 시간당 90잔 응대, 신입 3명 교육`;

const QUESTIONS_PLACEHOLDER = `실제 지원할 회사의 자소서 문항을 붙여넣으세요.

예)
1. 지원 동기와 입사 후 포부를 기술하시오. (800자)
2. 본인의 강점을 발휘해 문제를 해결한 경험을 기술하시오. (800자)`;

export function ProfileForm({ context, onChange }: ProfileFormProps) {
  const [draftTag, setDraftTag] = React.useState("");
  const tags = context.strengthTags;
  const suggestions = SECTOR_MAP[context.sector]?.strengthSuggestions ?? [];

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= 12) return;
    onChange({ strengthTags: [...tags, trimmed] });
    setDraftTag("");
  }

  function removeTag(value: string) {
    onChange({ strengthTags: tags.filter((tag) => tag !== value) });
  }

  return (
    <div className="space-y-5">
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
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addTag(draftTag)}
            disabled={!draftTag.trim()}
          >
            <Plus />
            추가
          </Button>
        </div>

        {suggestions.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">
              {SECTOR_MAP[context.sector].label}에서 자주 통하는 강점 — 눌러서 추가
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions
                .filter((item) => !tags.includes(item))
                .map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addTag(item)}
                    className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    + {item}
                  </button>
                ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* 경험 */}
      <div className="space-y-2">
        <Label htmlFor="experiences">이력 · 프로젝트 · 실무/아르바이트 경험</Label>
        <Textarea
          id="experiences"
          rows={10}
          placeholder={EXPERIENCE_PLACEHOLDER}
          className="text-[13px] leading-relaxed"
          value={context.experiences}
          onChange={(event) => onChange({ experiences: event.target.value })}
        />
      </div>

      {/* 이력서 */}
      <div className="space-y-2">
        <Label htmlFor="resumeDraft">
          현재 이력서 내용 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Textarea
          id="resumeDraft"
          rows={7}
          placeholder="이미 써 둔 이력서가 있으면 통째로 붙여넣으세요. 이 회사에 맞게 재배치해 드립니다."
          className="text-[13px] leading-relaxed"
          value={context.resumeDraft}
          onChange={(event) => onChange({ resumeDraft: event.target.value })}
        />
      </div>

      {/* 자소서 문항 */}
      <div className="space-y-2">
        <Label htmlFor="coverLetterQuestions">
          자기소개서 문항 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Textarea
          id="coverLetterQuestions"
          rows={5}
          placeholder={QUESTIONS_PLACEHOLDER}
          className="text-[13px] leading-relaxed"
          value={context.coverLetterQuestions}
          onChange={(event) => onChange({ coverLetterQuestions: event.target.value })}
        />
      </div>

      {/* 자소서 초안 */}
      <div className="space-y-2">
        <Label htmlFor="coverLetterDraft">
          자기소개서 · 지원동기 초안 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Textarea
          id="coverLetterDraft"
          rows={6}
          placeholder="써 둔 초안이 있으면 붙여넣으세요. 기업 분석 결과에 맞춰 다시 설계해 드립니다."
          className="text-[13px] leading-relaxed"
          value={context.coverLetterDraft}
          onChange={(event) => onChange({ coverLetterDraft: event.target.value })}
        />
      </div>

      {/* 톤앤매너 */}
      <div className="space-y-2">
        <Label>톤앤매너</Label>
        <ToggleGroup
          type="single"
          value={context.tone}
          onValueChange={(value) => {
            if (value) onChange({ tone: value as ToneKey });
          }}
        >
          {TONE_PRESETS.map((item) => (
            <ToggleGroupItem key={item.key} value={item.key} aria-label={item.label}>
              <span className="font-semibold">{item.label}</span>
              <span className="text-[10px] opacity-70">{item.short}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
