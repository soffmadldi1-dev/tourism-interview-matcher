import type { TourismSector, ToneKey } from "@/lib/types";

/* ────────────────────────────────────────────────────────────
 * 관광 산업 업종 프리셋
 *   - searchHints : 검색 쿼리 생성 시 덧붙일 업종 특화 키워드
 *   - lens        : LLM이 그 업종의 관점으로 분석하도록 주는 지침
 * ──────────────────────────────────────────────────────────── */

export interface SectorPreset {
  key: TourismSector;
  label: string;
  emoji: string;
  description: string;
  sampleCompanies: string[];
  sampleJobs: string[];
  searchHints: string[];
  lens: string;
  /** 이 업종에서 자주 통하는 강점 태그 */
  strengthSuggestions: string[];
}

export const SECTOR_PRESETS: SectorPreset[] = [
  {
    key: "hotel",
    label: "호텔 · 리조트",
    emoji: "🏨",
    description: "객실·F&B·연회 운영, 브랜드 서비스 표준, RevPAR 관리",
    sampleCompanies: ["파라다이스호텔", "롯데호텔", "신라호텔", "조선호텔앤리조트"],
    sampleJobs: ["프론트오피스", "F&B 서비스", "객실 예약/레비뉴", "세일즈&마케팅"],
    searchHints: ["객실 점유율", "RevPAR", "신규 브랜드", "리뉴얼", "F&B", "멤버십"],
    lens:
      "객실·F&B·연회의 수익 구조, 브랜드 서비스 표준(SOP), 인력 운영과 이직률, " +
      "OTA 의존도와 직판 비중, 외국인 투숙객 응대 역량을 중심으로 본다.",
    strengthSuggestions: [
      "대면 고객응대",
      "컴플레인 해결",
      "외국어 응대(영/중/일)",
      "PMS(오페라) 사용",
      "업셀링",
      "연회·이벤트 운영",
      "교대근무 적응력",
    ],
  },
  {
    key: "ota",
    label: "여행사 · OTA · 플랫폼",
    emoji: "✈️",
    description: "상품 기획·소싱, 채널 운영, 데이터 기반 전환율 개선",
    sampleCompanies: ["하나투어", "야놀자", "모두투어", "노랑풍선", "인터파크트리플"],
    sampleJobs: ["상품기획(MD)", "여행상품 운영", "제휴/소싱", "퍼포먼스 마케팅", "CS 기획"],
    searchHints: ["패키지 상품", "FIT", "플랫폼 전환", "제휴", "인바운드", "거래액", "앱 개편"],
    lens:
      "상품 소싱–가격–채널의 마진 구조, 패키지에서 FIT·자유여행으로의 이동, " +
      "앱/웹 전환율과 재구매, 항공·현지 파트너 협상력, DX 전환 속도를 중심으로 본다.",
    strengthSuggestions: [
      "여행상품 기획",
      "일정 설계",
      "현지 파트너 커뮤니케이션",
      "엑셀/데이터 분석",
      "SNS 콘텐츠 제작",
      "CS 응대",
      "인솔·TC 경험",
    ],
  },
  {
    key: "public",
    label: "공공기관 · DMO · 재단",
    emoji: "🏛️",
    description: "정책 사업 기획, 지역관광 활성화, 성과지표 관리",
    sampleCompanies: [
      "한국관광공사",
      "서울관광재단",
      "경기관광공사",
      "부산관광공사",
      "지역관광기구(DMO)",
    ],
    sampleJobs: ["관광사업 기획", "국제관광/인바운드", "지역관광 진흥", "홍보/마케팅", "행정"],
    searchHints: ["사업계획", "공모", "국정과제", "지역관광", "인바운드 유치", "예산", "보도자료"],
    lens:
      "정부 정책 기조와의 정합성, 연간 사업계획과 예산 편성, 정량 성과지표(KPI)와 " +
      "국민 체감도, 지역 이해관계자 조율, 공정성·절차 준수를 중심으로 본다. " +
      "민간의 '매출' 언어보다 '공공성·파급효과' 언어를 쓴다.",
    strengthSuggestions: [
      "사업계획서 작성",
      "정산·행정 실무",
      "이해관계자 조율",
      "보고서/제안서 작성",
      "통계·성과 분석",
      "지역 네트워크",
      "공공기관 인턴 경험",
    ],
  },
  {
    key: "mice",
    label: "MICE · 컨벤션 · 전시",
    emoji: "🎪",
    description: "행사 기획·운영, 참가자 관리, 스폰서·부스 세일즈",
    sampleCompanies: ["킨텍스", "코엑스", "벡스코", "PCO 전문기업", "지역 컨벤션뷰로"],
    sampleJobs: ["행사기획(PCO/PEO)", "전시 운영", "스폰서십 세일즈", "참가자 관리", "국제회의"],
    searchHints: ["국제회의 유치", "전시회", "참관객", "부스", "하이브리드 행사", "MICE 지원"],
    lens:
      "행사 유치–준비–운영–정산의 전체 사이클, 참가자·주최자·협력사 3자 이해관계, " +
      "현장 리스크 대응과 타임라인 관리, 스폰서 세일즈와 예산 균형을 중심으로 본다.",
    strengthSuggestions: [
      "행사 기획/운영",
      "현장 위기대응",
      "타임라인 관리",
      "협력사 관리",
      "등록/참가자 관리",
      "제안서·PT",
      "다국어 진행",
    ],
  },
  {
    key: "transport",
    label: "항공 · 크루즈 · 교통",
    emoji: "🛫",
    description: "운항·여객 서비스, 노선 전략, 안전 규정 준수",
    sampleCompanies: ["대한항공", "아시아나항공", "제주항공", "티웨이항공", "인천국제공항공사"],
    sampleJobs: ["객실승무", "여객서비스(지상직)", "노선/네트워크 기획", "화물", "공항 운영"],
    searchHints: ["신규 노선", "기재 도입", "탑승률", "안전", "여객 수요", "공항 서비스"],
    lens:
      "노선·기재 운용 효율과 탑승률, 안전·규정 준수(최우선), 정시성, " +
      "여객 서비스 표준화, 성수기/비수기 수요 변동 대응을 중심으로 본다.",
    strengthSuggestions: [
      "안전규정 준수",
      "다중 고객 응대",
      "위기 상황 대응",
      "외국어 회화",
      "체력·근태 성실성",
      "팀워크",
      "서비스 매뉴얼 숙지",
    ],
  },
  {
    key: "other",
    label: "기타 · 직접 입력",
    emoji: "🧭",
    description: "관광 벤처, 로컬 콘텐츠, 렌터카, 교육 등",
    sampleCompanies: ["관광 스타트업", "로컬 콘텐츠 기업", "관광 교육기관"],
    sampleJobs: ["기획", "운영", "마케팅"],
    searchHints: ["신규 사업", "투자 유치", "서비스 출시", "제휴"],
    lens: "관광 산업 전반의 일반 프레임(수요–공급–채널–경험 설계)으로 본다.",
    strengthSuggestions: ["기획력", "커뮤니케이션", "문제해결", "실행력", "고객 인터뷰"],
  },
];

export const SECTOR_MAP: Record<TourismSector, SectorPreset> = SECTOR_PRESETS.reduce(
  (acc, preset) => ({ ...acc, [preset.key]: preset }),
  {} as Record<TourismSector, SectorPreset>,
);

/* ────────────────────────────────────────────────────────────
 * 톤앤매너 프리셋
 * ──────────────────────────────────────────────────────────── */

export interface TonePreset {
  key: ToneKey;
  label: string;
  short: string;
  instruction: string;
}

export const TONE_PRESETS: TonePreset[] = [
  {
    key: "confident",
    label: "자신감 넘치는",
    short: "주도적 · 성과 중심",
    instruction:
      "능동태와 단정형 어미를 쓴다. 성과와 숫자를 앞세우고, '~한 것 같습니다' 같은 " +
      "완충 표현을 제거한다. 다만 근거 없는 과장은 금지하며, 확인되지 않은 성과는 쓰지 않는다.",
  },
  {
    key: "calm",
    label: "차분하고 전문적인",
    short: "논리적 · 신뢰 중심",
    instruction:
      "결론 → 근거 → 사례 순의 두괄식 구조를 유지한다. 감탄사와 과장 형용사를 배제하고, " +
      "직무 전문 용어를 정확하게 사용한다. 문장은 짧고 담백하게 쓴다.",
  },
  {
    key: "global",
    label: "글로벌 지향적인",
    short: "국제 감각 · 인바운드 중심",
    instruction:
      "다국적 고객 응대, 문화 간 커뮤니케이션, 인바운드/아웃바운드 시장 감각을 " +
      "자연스럽게 드러낸다. 필요한 경우 핵심 용어에 영문을 병기한다(예: 인바운드(inbound)). " +
      "다만 답변 본문은 한국어를 유지한다.",
  },
];

export const TONE_MAP: Record<ToneKey, TonePreset> = TONE_PRESETS.reduce(
  (acc, preset) => ({ ...acc, [preset.key]: preset }),
  {} as Record<ToneKey, TonePreset>,
);
