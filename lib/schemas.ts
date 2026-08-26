import { z } from "zod";

/**
 * 입력값 검증 스키마.
 *
 * 이 앱은 서버로 아무것도 보내지 않으므로, 검증의 목적은 "잘못된 요청 차단"이 아니라
 * **사용자가 빈칸을 놓치지 않도록 돕는 것**입니다. 그래서 규칙을 느슨하게 두고,
 * 안내 문구를 친절하게 씁니다.
 */

export const SECTOR_VALUES = [
  "hotel",
  "ota",
  "public",
  "mice",
  "transport",
  "other",
] as const;

export const TONE_VALUES = ["confident", "calm", "global"] as const;

export const sectorSchema = z.enum(SECTOR_VALUES);
export const toneSchema = z.enum(TONE_VALUES);

/** 1단계 — 기업 정보 */
export const companyFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "기업명을 2자 이상 입력해 주세요.")
    .max(60, "기업명이 너무 깁니다."),
  jobTitle: z
    .string()
    .trim()
    .min(2, "지원 직무를 2자 이상 입력해 주세요.")
    .max(60, "직무명이 너무 깁니다."),
  sector: sectorSchema,
  homepageUrl: z.string().trim().max(300).default(""),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

/** 3단계 — 내 정보 */
export const profileFormSchema = z.object({
  strengthTags: z.array(z.string().trim().min(1)).max(12, "강점 태그는 최대 12개까지입니다."),
  experiences: z.string().trim().max(8000, "8000자 이내로 입력해 주세요.").default(""),
  resumeDraft: z.string().trim().max(12000, "12000자 이내로 입력해 주세요.").default(""),
  coverLetterQuestions: z.string().trim().max(3000).default(""),
  coverLetterDraft: z.string().trim().max(12000).default(""),
  tone: toneSchema,
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
