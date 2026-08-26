import type { TourismSector } from "@/lib/types";

/**
 * 검색 링크 빌더.
 *
 * 서버도 API도 쓰지 않습니다. 사용자가 입력한 기업명으로 각 포털의 검색 URL을
 * 조립해 줄 뿐이고, 실제 자료 열람은 사용자가 새 탭에서 직접 합니다.
 * 그래서 이 기능은 비용이 전혀 들지 않습니다.
 */

export interface SearchLink {
  label: string;
  /** 이 링크에서 무엇을 확인해야 하는지 */
  purpose: string;
  url: string;
  /** 반드시 봐야 하는 핵심 링크 */
  essential: boolean;
}

export interface SearchGroup {
  key: string;
  title: string;
  description: string;
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

  /* 1. 기업이 스스로 말하는 것 ───────────────────────────── */
  const identityLinks: SearchLink[] = [
    {
      label: "인재상 · 미션 · 비전",
      purpose: "회사가 공식적으로 내세우는 인재상 문구를 그대로 확보하세요.",
      url: googleWeb(`${name} 인재상 미션 비전`),
      essential: true,
    },
    {
      label: "채용 페이지 · 채용공고",
      purpose: "자격요건과 우대사항이 곧 면접 평가표입니다. 문장 그대로 복사하세요.",
      url: googleWeb(`${name} 채용 ${job} 자격요건 우대사항`),
      essential: true,
    },
    {
      label: "회사 소개 · 사업 영역",
      purpose: "어떤 사업으로 돈을 버는지 파악하세요.",
      url: googleWeb(`${name} 회사소개 사업영역`),
      essential: false,
    },
  ];

  if (domain) {
    identityLinks.unshift({
      label: `홈페이지 내부 전체 검색 (${domain})`,
      purpose: "홈페이지 안의 모든 페이지를 한 번에 훑습니다. 가장 신뢰도 높은 1차 자료입니다.",
      url: googleWeb(`site:${domain} 인재상 OR 채용 OR 비전 OR 사업`),
      essential: true,
    });
    identityLinks.push({
      label: `홈페이지 보도자료 · 뉴스룸 (${domain})`,
      purpose: "회사가 직접 발표한 내용. 언론 기사보다 정확합니다.",
      url: googleWeb(`site:${domain} 보도자료 OR 뉴스 OR 공지`),
      essential: false,
    });
  }

  groups.push({
    key: "identity",
    title: "회사가 스스로 말하는 것",
    description: "공식 자료입니다. 여기 있는 표현은 면접에서 그대로 인용해도 안전합니다.",
    links: identityLinks,
  });

  /* 2. 최근 활동과 현안 ─────────────────────────────────── */
  groups.push({
    key: "recent",
    title: "최근 활동 · 행사 · 현안",
    description:
      "면접에서 차이를 만드는 구간입니다. 최근 1~2년 안의 소식만 보세요. 오래된 기사는 오히려 독입니다.",
    links: [
      {
        label: "네이버 뉴스 검색",
        purpose: "국내 매체 기사. 최신순으로 정렬해서 최근 1년치를 훑으세요.",
        url: naverNews(name),
        essential: true,
      },
      {
        label: "구글 뉴스 검색",
        purpose: "네이버에 안 걸리는 업계 전문지 기사가 여기 있습니다.",
        url: googleNews(name),
        essential: true,
      },
      {
        label: "신규 사업 · 전략 발표",
        purpose: "'왜 지금 사람을 뽑는가'의 답이 여기 있는 경우가 많습니다.",
        url: googleWeb(`${name} 신규사업 OR 전략 OR MOU OR 협약 2025 2026`),
        essential: true,
      },
      {
        label: "행사 · 캠페인 · 수상",
        purpose: "지원자가 언급하면 '조사 많이 했구나' 소리를 듣는 소재입니다.",
        url: googleWeb(`${name} 행사 OR 개최 OR 캠페인 OR 수상`),
        essential: false,
      },
    ],
  });

  /* 3. 업종별 심층 자료 ─────────────────────────────────── */
  const deepLinks: SearchLink[] = [];

  if (sector === "public") {
    deepLinks.push(
      {
        label: "알리오 (공공기관 경영정보)",
        purpose: "조직도·정원·연봉·주요사업이 공식 수치로 공개되어 있습니다.",
        url: "https://www.alio.go.kr/item/itemOrganizationHtml.do",
        essential: true,
      },
      {
        label: "기관 사업계획 · 공고",
        purpose: "공공기관 면접은 '올해 무슨 사업을 하는가'를 아는 것이 핵심입니다.",
        url: googleWeb(`${name} 사업계획 OR 공모 OR 공고 2026`),
        essential: true,
      },
      {
        label: "국정과제 · 정책 방향",
        purpose: "상위 정책과 기관 사업이 어떻게 연결되는지 파악하세요.",
        url: googleWeb(`관광 정책 국정과제 ${new Date().getFullYear()}`),
        essential: false,
      },
    );
  } else {
    deepLinks.push(
      {
        label: "DART 전자공시 (실적 · 사업보고서)",
        purpose: "상장사라면 사업보고서에 사업 구조와 리스크가 그대로 적혀 있습니다.",
        url: "https://dart.fss.or.kr/dsab007/main.do",
        essential: false,
      },
      {
        label: "잡플래닛 · 현직자 리뷰",
        purpose: "실제 근무 환경. 단, 불만 글이 과대표집되니 참고만 하세요.",
        url: googleWeb(`${name} 잡플래닛 OR 크레딧잡 리뷰`),
        essential: false,
      },
      {
        label: "실적 · 매출 · 투자",
        purpose: "회사가 성장 중인지 방어 중인지에 따라 어필할 강점이 달라집니다.",
        url: googleWeb(`${name} 매출 OR 실적 OR 투자유치`),
        essential: false,
      },
    );
  }

  deepLinks.push({
    label: `${SECTOR_KEYWORD[sector]} 업계 동향`,
    purpose: "회사 하나만 보면 좁습니다. 업계 흐름 속에서 이 회사의 위치를 파악하세요.",
    url: googleNews(SECTOR_KEYWORD[sector]),
    essential: false,
  });

  groups.push({
    key: "deep",
    title: "한 걸음 더 들어가기",
    description: "여기까지 보면 다른 지원자와 확실히 차이가 납니다.",
    links: deepLinks,
  });

  /* 4. 채용 정보 ────────────────────────────────────────── */
  groups.push({
    key: "hiring",
    title: "채용공고 원문 찾기",
    description: "공고 원문의 문장이 곧 평가 기준입니다. 반드시 원문을 확보하세요.",
    links: [
      {
        label: "사람인",
        purpose: "공고 원문의 자격요건·우대사항을 통째로 복사해 두세요.",
        url: `https://www.saramin.co.kr/zf_user/search?searchword=${q(name)}`,
        essential: true,
      },
      {
        label: "잡코리아",
        purpose: "사람인에 없는 공고가 올라와 있을 수 있습니다.",
        url: `https://www.jobkorea.co.kr/Search/?stext=${q(name)}`,
        essential: false,
      },
      {
        label: "워크넷 (고용노동부)",
        purpose: "공공·중소기업 공고가 여기에만 있는 경우가 있습니다.",
        url: `https://www.work24.go.kr/wk/a/b/1200/retriveDtlEmpSrchList.do`,
        essential: false,
      },
      {
        label: "네이버 통합검색 (공고 잔여 흔적)",
        purpose: "마감된 공고라도 캐시나 블로그에 남아 있으면 그대로 참고 가능합니다.",
        url: naverWeb(`${name} 채용공고 ${job}`),
        essential: false,
      },
    ],
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
