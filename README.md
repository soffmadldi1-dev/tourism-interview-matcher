# 관광 면접 스토리 매처 (Tourism Interview Story Matcher)

관광 산업 취업 준비생·이직자를 위한 **기업 분석 → 경험 매칭 → 면접 답변 생성** 툴입니다.

홈페이지의 인재상 문구만 외워 가는 준비를 벗어나, 기업의 **최근 전략과 현안**을 실시간 웹 검색으로 파악하고
지원자의 실제 경험을 그 현안과 1:1로 연결한 면접 스크립트를 만듭니다.

---

## 1. 무엇을 하는가

| 단계 | 이름 | 산출물 |
| --- | --- | --- |
| Step 1 | 기업 분석 (Company Intelligence) | 미션·비전·인재상 해석 / 핵심 사업 모델 / 최근 1~2년 신규 전략 / 최근 이슈·보도자료 / 면접관 관점 평가 키워드 / 주의할 현안 / 출처 |
| Step 2 | 지원자 프로필 (Candidate Profiling) | 강점 태그, 강점 상세, 이력·프로젝트·아르바이트 경험, 지원동기 초안, 톤앤매너 |
| Step 3 | 매칭 & 생성 (Matching Engine) | 맞춤형 1분 자기소개 / 기업 니즈↔경험 교차 매칭표 / STAR 답변 3개 / 지원동기 + 기여 로드맵 / 예상 꼬리질문·방어 논리 3개 / 사용 전 확인사항 |

**업종 프리셋**: 호텔·리조트 / 여행사·OTA / 공공기관·DMO / MICE / 항공·교통 / 기타
— 프리셋마다 검색 키워드, 분석 관점(lens), 추천 강점 태그가 다르게 적용됩니다.

**톤앤매너**: 자신감 넘치는 · 차분하고 전문적인 · 글로벌 지향적인

**내보내기**: 섹션별 복사 / 전체 복사 / 마크다운 다운로드 / PDF 저장(인쇄)

---

## 2. 기술 스택

- **Next.js 15 (App Router) + TypeScript**
- **Tailwind CSS 3 + shadcn/ui 패턴** (Radix UI primitives, `cva`, `tailwind-merge`)
- **Anthropic Claude API** (`@anthropic-ai/sdk`) — 기본 모델 `claude-opus-5`
  - Structured Outputs (`output_config.format` + `zodOutputFormat`) 로 JSON 스키마 강제
  - 서버 도구 `web_search_20260209` 로 검색 API 없이도 동작
- **실시간 웹 검색**: Tavily → Serper(Google) → Perplexity → Claude 내장 web_search → 사전지식 (자동 폴백)
- **React Hook Form + Zod** (입력 검증, 클라이언트/서버 스키마 공유)
- **Lucide React** (아이콘)

---

## 3. 빠른 시작

```bash
npm install
```

```bash
cp .env.example .env.local
```

`.env.local` 을 열어 **`ANTHROPIC_API_KEY` 를 반드시 채웁니다.** (나머지는 선택)

```bash
npm run dev
```

브라우저에서 <http://localhost:3000> 접속.

> 기본 포트가 사용 중이면 `npm run dev -- --port 3100` 처럼 지정하세요.

### 환경 변수

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | [console.anthropic.com](https://console.anthropic.com/settings/keys) 에서 발급 |
| `ANTHROPIC_MODEL` | | 기본값 `claude-opus-5`. 변경 시 `web_search_20260209` 지원 모델인지 확인하세요 |
| `TAVILY_API_KEY` | | 1순위 검색 공급자 ([app.tavily.com](https://app.tavily.com)) |
| `SERPER_API_KEY` | | 2순위 — Google SERP ([serper.dev](https://serper.dev)) |
| `PERPLEXITY_API_KEY` | | 3순위 |
| `SEARCH_PROVIDER` | | `auto`(기본) / `tavily` / `serper` / `perplexity` / `native` 로 강제 지정 |

**검색 키가 하나도 없어도 동작합니다.** Claude 내장 `web_search` 서버 도구로 자동 폴백합니다.
다만 외부 검색 API를 붙이면 근거 수집량이 늘어 분석 품질이 올라갑니다.

---

## 4. 폴더 구조

```
tourism-interview-matcher/
├── app/
│   ├── api/
│   │   ├── company-search/route.ts   # Step 1: 검색 + 구조화
│   │   ├── generate-story/route.ts   # Step 3: 매칭 + 스토리 생성
│   │   └── health/route.ts           # 환경 설정 점검
│   ├── globals.css                   # 디자인 토큰 + 인쇄(PDF) 스타일
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                           # shadcn/ui 스타일 프리미티브
│   ├── workspace.tsx                 # 2-Pane 레이아웃 + 상태 오케스트레이션
│   ├── company-form.tsx              # Step 1 입력 폼
│   ├── candidate-form.tsx            # Step 2 입력 폼
│   ├── company-intel-report.tsx      # Step 1 리포트
│   ├── story-report.tsx              # Step 3 리포트
│   └── copy-button.tsx
├── lib/
│   ├── prompts/
│   │   ├── company.ts                # 기업 분석 프롬프트 (리서치 / 구조화 분리)
│   │   └── story.ts                  # 매칭·스토리 생성 프롬프트
│   ├── schemas.ts                    # Zod 스키마 (단일 원천)
│   ├── types.ts                      # 파생 타입 + API 계약
│   ├── search.ts                     # 검색 공급자 폴백 체인
│   ├── anthropic.ts                  # 클라이언트 팩토리 + 에러 정규화
│   ├── api.ts                        # Route Handler 응답 헬퍼
│   ├── presets.ts                    # 업종·톤앤매너 프리셋
│   ├── export.ts                     # 마크다운 / 클립보드 / 다운로드 / 인쇄
│   └── utils.ts
└── .env.example
```

---

## 5. 아키텍처 노트

### 왜 기업 분석을 2단계로 나눴는가

```
[1] 근거 수집        [2] 구조화
검색 API 또는    →   Claude (도구 없음)
Claude web_search    + structured outputs → CompanyIntel JSON
```

서버 도구(`web_search`)와 structured outputs 를 한 호출에 섞지 않고 분리했습니다.

- 도구 호출은 `pause_turn` 으로 중단될 수 있어 재개 루프가 필요합니다 (`runNativeResearch` 가 처리).
- "근거 → 구조화"를 분리하면 **모델이 근거 없이 지어낸 내용을 걸러내기 쉽습니다.** 구조화 단계 프롬프트는
  "위 근거에 없는 사실을 만들지 말 것"을 명시하고, 근거가 없으면 `confidence: "low"` 를 강제합니다.

### 프롬프트 설계 원칙

- `lib/prompts/company.ts` — 사실/추론 구분, `(추정)` 표기 강제, URL 창작 금지, 업종별 관점(lens) 주입
- `lib/prompts/story.ts` — **"기업 현안 → 지원자 경험" 순서로 사고**하게 강제.
  지원자가 제공하지 않은 숫자·회사명·성과는 창작 금지이며, 부족하면 `[실제 수치 기입]` 플레이스홀더를 남기고
  `cautions` 에 기록합니다. 매칭표에는 최소 1개의 `gap` 을 정직하게 표시하도록 지시합니다.

### 폴백 · 에러 처리

| 상황 | 동작 |
| --- | --- |
| 외부 검색 키 없음 | Claude 내장 `web_search` 로 진행, 배지에 "Claude 내장 웹검색" 표기 |
| 외부 검색 API 실패 | 다음 순위 공급자 → 내장 검색 → 사전지식 순으로 폴백, 실패 사유를 UI 안내 문구로 노출 |
| 검색 완전 실패 | 에러로 끝내지 않고 `confidence: "low"` + 교차 확인 경고와 함께 결과 제공 |
| 일부 쿼리만 실패 | 성공한 결과로 계속 진행 (`Promise.allSettled`) |
| API 키 없음/무효 | `MISSING_API_KEY` — 조치 방법 힌트와 함께 안내 |
| Rate limit | `RATE_LIMITED` (HTTP 429) — 재시도 안내 |
| 모델 응답 거부 | `stop_reason: "refusal"` 감지 → 사유와 함께 안내 |
| 응답 잘림 | `stop_reason: "max_tokens"` 감지 → 입력 축소 안내 |

에러는 모두 `{ ok: false, error: { code, message, hint } }` 형태로 통일되어 있습니다 (`lib/types.ts`).

---

## 6. API 명세

### `POST /api/company-search`

```jsonc
// 요청
{
  "companyName": "하나투어",
  "jobTitle": "상품기획(MD)",
  "sector": "ota",            // hotel | ota | public | mice | transport | other
  "extraContext": ""          // 선택: 채용공고 발췌 등
}
```

```jsonc
// 응답 (성공)
{
  "ok": true,
  "data": {
    "companyName": "하나투어",
    "jobTitle": "상품기획(MD)",
    "sector": "ota",
    "overview": "...",
    "identity": { "mission": "...", "vision": "...", "talentProfile": [...] },
    "business": { "coreModels": [...], "newStrategies": [...] },
    "recentIssues": [...],
    "interviewerKeywords": [...],
    "watchOuts": [...],
    "sources": [...],
    "confidence": "medium",
    "dataAsOf": "2026-08",
    "retrieval": { "provider": "tavily", "resultCount": 18, "fallbackUsed": false, "notice": "" }
  }
}
```

### `POST /api/generate-story`

```jsonc
// 요청
{
  "companyIntel": { /* Step 1 응답의 data (retrieval 제외) */ },
  "sector": "ota",
  "candidate": {
    "strengthTags": ["여행상품 기획", "현지 파트너 커뮤니케이션"],
    "strengthDetail": "",
    "experiences": "2024.03~2025.02 ...",
    "motivationDraft": "",
    "tone": "calm"            // confident | calm | global
  }
}
```

응답 `data` 는 `oneMinutePitch` / `matchMatrix` / `starAnswers` / `motivation` / `followUps` / `cautions` 를 담습니다.

### `GET /api/health`

키 설정 여부만 boolean 으로 확인합니다 (키 값은 절대 반환하지 않습니다).

---

## 7. 테스트 가이드

### 7-1. 환경 점검

```bash
curl http://localhost:3000/api/health
```

`anthropicKey: true` 인지 확인합니다. `false` 면 `.env.local` 을 저장한 뒤 **개발 서버를 재시작**하세요.

### 7-2. 타입 검사 · 빌드

```bash
npm run typecheck
```

```bash
npm run build
```

### 7-3. API 단독 호출

```bash
curl -X POST http://localhost:3000/api/company-search -H "Content-Type: application/json" -d "{\"companyName\":\"하나투어\",\"jobTitle\":\"상품기획\",\"sector\":\"ota\",\"extraContext\":\"\"}"
```

### 7-4. UI 시나리오 체크리스트

| # | 시나리오 | 기대 결과 |
| --- | --- | --- |
| 1 | 빈 폼으로 "기업 분석 시작" | "기업명을 2자 이상 입력해 주세요." 등 한국어 검증 메시지 |
| 2 | 업종 프리셋 전환 | 샘플 기업/직무 칩, 분석 관점 문구, 추천 강점 태그가 함께 바뀜 |
| 3 | 샘플 칩 클릭 | 해당 입력란이 자동으로 채워짐 |
| 4 | 기업 분석 실행 | 우측에 단계별 로딩 인디케이터 → 분석 리포트, 좌측 탭이 "2. 내 프로필"로 자동 전환 |
| 5 | 분석 완료 전 프로필 탭 | 탭 비활성화, 폼 입력 불가 |
| 6 | 경험 30자 미만으로 제출 | "주요 이력/프로젝트를 30자 이상 구체적으로 입력해 주세요." |
| 7 | 스토리 생성 | 1분 자기소개 → 매칭표 → STAR → 지원동기 → 꼬리질문 순으로 렌더링 |
| 8 | 톤앤매너 변경 후 재생성 | 문체가 달라진 스크립트 생성 |
| 9 | "마크다운 저장" | `기업명_직무_면접스토리.md` 다운로드 |
| 10 | "PDF로 저장" | 인쇄 대화상자 — 좌측 입력 패널·버튼은 제외되고 리포트만 출력 |
| 11 | 검색 키 없이 실행 | "Claude 내장 웹검색" 배지 + 안내 문구 표시, 정상 동작 |
| 12 | `ANTHROPIC_API_KEY` 제거 후 실행 | "Claude API 키가 설정되지 않았습니다" + `.env.local` 안내 |
| 13 | 모바일 폭(375px) | 단일 컬럼, 가로 스크롤 없음, 헤더 고정 |

### 7-5. 검증 완료 상태 (2026-08-25)

- `npm run typecheck` 통과, `npm run build` 성공 (4개 라우트)
- 로컬 dev 실행 후 시나리오 1·3·4·9·12·13 브라우저 검증 완료
- 리포트 렌더링(Step 1 / Step 3)과 마크다운 내보내기는 목(mock) 응답으로 렌더 경로 검증 완료
- ⚠️ **실제 Claude API 호출 경로는 미검증** — 이 환경에 API 키가 없었습니다.
  키를 넣고 7-1 → 7-3 → 7-4 순으로 한 번 돌려보세요.

---

## 8. 알려진 제약 · 다음 단계

- **정확도 한계**: 웹 검색 결과와 모델 추론에 의존하므로, 비상장·소규모 기업일수록 `confidence` 가 낮게 나옵니다.
  리포트의 신뢰도 배지와 출처를 반드시 확인하세요.
- **응답 시간**: 검색 + 2회 모델 호출로 30초~2분 정도 걸립니다. Vercel 배포 시 `maxDuration = 300` 이 필요합니다
  (Hobby 플랜은 60초 제한이므로 Pro 이상 권장).
- **비용**: 1회 분석 + 스토리 생성에 Claude Opus 5 기준 수십 원~수백 원 수준의 토큰이 소모됩니다.
  비용을 낮추려면 `.env.local` 에서 `ANTHROPIC_MODEL=claude-sonnet-5` 로 바꾸세요.
- **모델 거부 폴백 미적용**: 서버사이드 `fallbacks` 파라미터는 넣지 않았습니다. 이 용도에서 거부가 발생할 가능성이
  낮고 베타 파라미터 의존을 피하기 위해서이며, 대신 `stop_reason: "refusal"` 을 감지해 사용자에게 안내합니다.
- **다음 단계 후보**: 결과 저장/불러오기(로컬스토리지 또는 DB), 여러 기업 비교, 음성 모의면접,
  자기소개서 문항별 초안 생성, 실제 채용공고 URL 파싱.

---

## 9. 면책

AI가 생성한 **초안**입니다. 기업 정보는 공식 홈페이지·채용공고에서, 본인 경험은 실제 사실 여부를
반드시 직접 확인한 뒤 사용하세요. 확인되지 않은 성과를 면접에서 말하는 것은 가장 큰 리스크입니다.
