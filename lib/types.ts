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
 *
 * 입력 항목은 의도적으로 최소화했습니다.
 * 이력서·자기소개서를 통째로 붙여넣으면 강점과 경험은 그 안에 이미 들어 있으므로,
 * 같은 내용을 두 번 적게 하지 않습니다.
 */
export interface PromptContext {
  /* ① 기업 정보 */
  companyName: string;
  jobTitle: string;
  sector: TourismSector;
  homepageUrl: string;

  /* ② 조사 자료 */
  /** 검색 링크를 열어 직접 복사해 온 원본 자료 */
  collectedMaterial: string;
  /** '기업 분석' 프롬프트를 돌려서 받은 결과 */
  companyAnalysis: string;

  /* ③ 내 서류 */
  /** 수업에서 만든 이력서 전문 */
  resumeText: string;
  /** 수업에서 만든 자기소개서 (문항 + 답변) */
  coverLetterText: string;
  tone: ToneKey;
}

export const EMPTY_CONTEXT: PromptContext = {
  companyName: "",
  jobTitle: "",
  sector: "hotel",
  homepageUrl: "",
  collectedMaterial: "",
  companyAnalysis: "",
  resumeText: "",
  coverLetterText: "",
  tone: "calm",
};

/** 좌측 입력 패널의 단계 */
export type InputStep = "company" | "material" | "profile";

/** 우측 결과 패널의 단계 */
export type OutputStep = "search" | "analyze" | "document" | "interview";
