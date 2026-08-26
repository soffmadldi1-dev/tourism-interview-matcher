import type { TourismSector } from "@/lib/types";

/**
 * 검색 링크 빌더.
 *
 * 서버도 API도 쓰지 않습니다. 사용자가 입력한 기업명으로 각 포털의 검색 URL을
 * 조립해 줄 뿐이고, 실제 자료 열람은 사용자가 새 탭에서 직접 합니다.
 *
 * "왜 자동으로 긁어오지 않는가?" — 직접 읽는 과정 자체가 면접 준비이기 때문입니다.
 * 남이 요약해 준 것만 외우면 꼬리질문에서 무너집니다.
 */

export interface SearchLink {
  label: string;
  /** 이 링크에서 정확히 무엇을 복사해 와야 하는지 */
  copyThis: string;
  url: string;
  /** 반드시 봐야 하는 핵심 링크 */
  essential: boolean;
}

export interface SearchGroup {
  /** 화면에 표시할 순번 */
  step: number;
  key: string;
  title: string;
  /** 이 그룹에서 무엇을 얻는가 */
  goal: string;
  links: SearchLink[];
}

const q = (value: string) => encodeURIComponent(value);

/* ────────────────────────────────────────────────────────────
 * 포털별 검색 URL
 * ──────────────────────────────────────────────────────────── */

const naverNews = (query: string) =>
  `https://search.naver.com/search.naver?where=news&sm=tab_jum&query=${q(query)}`;

const naverWeb = (query: string) =>
  `https://search.naver.com/search.naver?query=${q(query)}`;

const googleWeb = (query: string) => `https://www.google.com/search?q=${q(query)}`;

const googleNews = (query: string) =>
  `https://news.google.com/search?q=${q(query)}&hl=ko&gl=KR&ceid=KR%3Ako`;

/* ────────────────────────────────────────────────────────────
 * 그룹 조립
 * ──────────────────────────────────────────────────────────── */

export function buildSearchGroups(
  companyName: string,
  jobTitle: string,
  sector: TourismSector,
  homepageUrl: string,
): SearchGroup[] {
  const name = companyName.trim();
  const job = jobTitle.trim();
  if (!name) return [];

  const domain = extractDomain(homepageUrl);
  const groups: SearchGroup[] = [];

  /* 1. 채용공고 ────────────────────────────────────────── */
  groups.push({
    step: 1,
    key: "hiring",
    title: "채용공고 원문 찾기",
    goal: "공고에 적힌 문장이 곧 면접 평가표입니다. 여기부터 시작하세요.",
    links: [
      {
        label: "사람인에서 찾기",
        copyThis: "자격요건 · 우대사항 · 주요업무 전체를 그대로 복사",
        url: `https://www.saramin.co.kr/zf_user/search?searchword=${q(name)}`,
        essential: true,
      },
      {
        label: "잡코리아에서 찾기",
        copyThis: "사람인에 공고가 없을 때 여기서 확인",
        url: `https://www.jobkorea.co.kr/Search/?stext=${q(name)}`,
        essential: false,
      },
      {
        label: "구글에서 채용공고 찾기",
        copyThis: "마감된 공고라도 캐시·블로그에 남아 있으면 그대로 참고 가능",
        url: googleWeb(`${name} 채용 ${job} 자격요건 우대사항`),
        essential: true,
      },
    ],
  });

  /* 2. 회사가 스스로 말하는 것 ──────────────────────────── */
  const identityLinks: SearchLink[] = [];

  if (domain) {
    identityLinks.push({
      label: `홈페이지 전체 훑기 (${domain})`,
      copyThis: "인재상·비전·사업소개 페이지에서 눈에 띄는 문장을 통째로 복사",
      url: googleWeb(`site:${domain} 인재상 OR 채용 OR 비전 OR 사업`),
      essential: true,
    });
  }

  identityLinks.push(
    {
      label: "인재상 · 미션 · 비전",
      copyThis: "인재상 키워드 3~5개를 회사가 쓴 표현 그대로 복사",
      url: googleWeb(`${name} 인재상 미션 비전`),
      essential: true,
    },
    {
      label: "회사 소개 · 사업 영역",
      copyThis: "어떤 사업으로 돈을 버는지 — 사업 부문 이름들을 복사",
      url: googleWeb(`${name} 회사소개 사업영역`),
      essential: true,
    },
  );

  if (domain) {
    identityLinks.push({
      label: `홈페이지 보도자료 · 뉴스룸 (${domain})`,
      copyThis: "회사가 직접 발표한 소식 제목 + 날짜 (언론 기사보다 정확)",
      url: googleWeb(`site:${domain} 보도자료 OR 뉴스 OR 공지`),
      essential: false,
    });
  }

  groups.push({
    step: 2,
    key: "identity",
    title: "회사가 스스로 말하는 것",
    goal: "공식 자료입니다. 여기 있는 표현은 면접에서 그대로 인용해도 안전합니다.",
    links: identityLinks,
  });

  /* 3. 최근 활동과 현안 ─────────────────────────────────── */
  groups.push({
    step: 3,
    key: "recent",
    title: "최근 활동 · 행사 · 현안",
    goal: "다른 지원자와 차이가 나는 구간. 최근 1~2년 것만 보세요.",
    links: [
      {
        label: "네이버 뉴스",
        copyThis: "기사 제목 + 날짜 + 한 줄 요약 형태로 5~10건",
        url: naverNews(name),
        essential: true,
      },
      {
        label: "구글 뉴스",
        copyThis: "네이버에 안 걸리는 업계 전문지 기사 제목 + 날짜",
        url: googleNews(name),
        essential: true,
      },
      {
        label: "신규 사업 · 전략 발표",
        copyThis: "새로 시작한 사업·협약 이름과 시점 — '왜 지금 뽑는가'의 답",
        url: googleWeb(`${name} 신규사업 OR 전략 OR MOU OR 협약 2025 2026`),
        essential: true,
      },
      {
        label: "행사 · 캠페인 · 수상",
        copyThis: "행사명과 규모 — 면접에서 언급하면 조사 많이 했다는 인상을 줌",
        url: googleWeb(`${name} 행사 OR 개최 OR 캠페인 OR 수상`),
        essential: false,
      },
    ],
  });

  /* 4. 업종별 심층 자료 ─────────────────────────────────── */
  const deepLinks: SearchLink[] = [];

  if (sector === "public") {
    deepLinks.push(
      {
        label: "알리오 (공공기관 경영정보)",
        copyThis: "주요사업 목록과 조직 구성 — 기관명으로 검색해서 확인",
        url: "https://www.alio.go.kr/item/itemOrganizationHtml.do",
        essential: false,
      },
      {
        label: "올해 사업계획 · 공모 공고",
        copyThis: "올해 진행 중인 사업 이름들 — 공공기관 면접의 핵심",
        url: googleWeb(`${name} 사업계획 OR 공모 OR 공고 ${new Date().getFullYear()}`),
        essential: true,
      },
    );
  } else {
    deepLinks.push(
      {
        label: "실적 · 매출 · 투자 소식",
        copyThis: "성장 중인지 방어 중인지 — 어필할 강점이 달라집니다",
        url: googleWeb(`${name} 매출 OR 실적 OR 투자유치`),
        essential: false,
      },
      {
        label: "현직자 리뷰 (잡플래닛 등)",
        copyThis: "실제 근무 분위기 (불만 글이 많으니 참고만)",
        url: googleWeb(`${name} 잡플래닛 OR 크레딧잡 리뷰`),
        essential: false,
      },
    );
  }

  deepLinks.push({
    label: `${SECTOR_KEYWORD[sector]} 동향`,
    copyThis: "업계 전체 흐름 2~3가지 — 이 회사의 위치를 설명할 때 씁니다",
    url: googleNews(SECTOR_KEYWORD[sector]),
    essential: false,
  });

  groups.push({
    step: 4,
    key: "deep",
    title: "한 걸음 더 들어가기",
    goal: "여유가 있으면 보세요. 여기까지 보면 확실히 차이가 납니다.",
    links: deepLinks,
  });

  return groups;
}

const SECTOR_KEYWORD: Record<TourismSector, string> = {
  hotel: "호텔 리조트 업계",
  ota: "여행사 OTA 업계",
  public: "관광 공공기관 정책",
  mice: "MICE 전시 컨벤션 업계",
  transport: "항공 여객 업계",
  other: "관광산업",
};

/** URL에서 도메인만 뽑습니다. 사용자가 대충 입력해도 최대한 살립니다. */
export function extractDomain(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const { hostname } = new URL(withProtocol);
    return hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

/** 사용자가 입력한 홈페이지 주소를 실제로 열 수 있는 형태로 정규화합니다. */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** 필수 링크만 골라냅니다 (한 번에 열기 기능용). */
export function essentialLinks(groups: SearchGroup[]): SearchLink[] {
  return groups.flatMap((group) => group.links.filter((link) => link.essential));
}

/** 네이버 검색도 쓸 수 있게 남겨 둡니다 (추후 확장용). */
export { naverWeb };
