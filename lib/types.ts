/**
 * 공용 타입.
 *
 * 이 앱은 서버 API를 호출하지 않습니다. 모든 상태는 브라우저 안에서만 살고,
 * localStorage 에 저장됩니다. (외부로 전송되는 데이터가 없습니다)
 */

/** 관광 산업 세부 업종 프리셋 */
export type TourismSector =
  | "hotel" // 호텔 / 리조트
  | "ota" // 여행사 / OTA / 플랫폼
  | "public" // 공공기관 / DMO / 재단
  | "mice" // MICE / 컨벤션 / 전시
  | "transport" // 항공 / 크루즈 / 교통
  | "other"; // 기타 · 직접 입력

/** 생성될 문장의 톤앤매너 */
export type ToneKey = "confident" | "calm" | "global";

/**
 * 프롬프트를 조립하는 데 필요한 모든 입력값.
 * 좌측 입력 폼의 상태가 그대로 여기에 담깁니다.
 */
export interface PromptContext {
  /* 1단계 — 기업 */
  companyName: string;
  jobTitle: string;
  sector: TourismSector;
  homepageUrl: string;

  /* 2단계 — 수집한 자료 */
  /** 검색 링크로 직접 모아서 붙여넣은 원본 자료 */
  collectedMaterial: string;
  /** '기업 분석' 프롬프트를 돌려서 받은 결과 */
  companyAnalysis: string;

  /* 3단계 — 나 */
  strengthTags: string[];
  experiences: string;
  resumeDraft: string;
  coverLetterQuestions: string;
  coverLetterDraft: string;
  tone: ToneKey;
}

export const EMPTY_CONTEXT: PromptContext = {
  companyName: "",
  jobTitle: "",
  sector: "hotel",
  homepageUrl: "",
  collectedMaterial: "",
  companyAnalysis: "",
  strengthTags: [],
  experiences: "",
  resumeDraft: "",
  coverLetterQuestions: "",
  coverLetterDraft: "",
  tone: "calm",
};

/** 좌측 입력 패널의 단계 */
export type InputStep = "company" | "material" | "profile";
