# modfolio-studio — 도메인 지식 (옛 CLAUDE.md 에서 원문 그대로)

> frontmatter 없음 = 항상 로드. 2026-09-30(fleet-4)에 `.modfolio/context/CLAUDE.md` 의
> `ECOSYSTEM_END` 뒤 repo 고유 구간에서 **원문 그대로** 옮겼다(MODFOLIO.md §Context map).
> 옮기지 않은 것: 「Quality Gate」(→ MODFOLIO.md 의 gate:quick/full/release) · 「Context Rot
> Prevention」「Model Routing」(→ `.modfolio/ai-routing.json`) · Skills/Sub Agents 목록(어댑터 설정).
> 실측과 달라진 사실은 원문을 고치지 않고 맨 아래 «정정» 에 적는다.

## 이 레포의 역할

Modfolio Studio 계열(Munseo, Umbracast, Sincheong)의 **그룹 랜딩 포탈**. Astro SSR 기반 정적 사이트.

## Tech Stack

- **Framework**: Astro SSR
- **Runtime**: Bun
- **Lint/Format**: Biome v2
- **배포**: CF Pages (`modfolio-studio`)
- **도메인**: `studio.modfolio.io`
- **DB**: 없음 (하위 앱이 각자 보유)

## 모노레포 구조

| 경로 | 프레임워크 | 도메인 | 역할 |
|------|-----------|--------|------|
| `apps/landing` | Astro SSR | studio.modfolio.io | 그룹 랜딩 포탈 |
| `apps/app` | SvelteKit 5 | lab.modfolio.io | Studio Lab (SSO 연동) |

스크립트 매핑:
- `bun run build` / `bun run dev` / `bun run typecheck` → apps/landing
- `bun run build:app` / `bun run dev:app` / `bun run typecheck:app` → apps/app
- `bun run check` → 루트 Biome (전체)

## Commands

| Command | Description |
|---------|-------------|
| `bun run check` | Biome lint + format 검사 |
| `bun run check:fix` | Biome 자동 수정 |
| `bun run typecheck` | Astro check (landing) |
| `bun run typecheck:app` | SvelteKit check (app) |
| `bun run build` | Astro build (landing) |
| `bun run build:app` | SvelteKit build (app) |
| `bun run dev` | Astro dev server |
| `bun run dev:app` | SvelteKit dev server |
| `bun run format` | Biome 자동 포맷 |

## 불변 원칙

> 생태계 공통 원칙은 `~/.claude/CLAUDE.md`에 정의. 아래는 이 레포 전용 규칙.

- **디자인 토큰 우선**: CSS 변수 없이 하드코딩 색상/spacing 금지
- **Astro 순수성**: 불필요한 `client:load` 지시자 사용 금지. 서버 렌더링 우선
- **Adobe Fonts 킷**: Studio 전용 킷 ID `glw6csk` 사용 (생태계 공용 `fmh4fod` 아님)
- 판단의 근거와 편차는 투명하게 기록

> **안 되는 것만 명시하고, 나머지는 다 된다.**

## 비주얼 아이덴티티: Cinematic Contrast

- **컨셉**: 엔터테인먼트 그룹의 영화적 대비 — 무거운 Display + 가벼운 Body
- **폰트 역할**:

| 역할 | 폰트 | 용도 |
|------|------|------|
| Display | freight-display-pro | 히어로, 섹션 제목 |
| Body | acumin-pro | 본문, 설명 |
| UI | aktiv-grotesk | 버튼, 라벨, 내비게이션 |
| Data | sandoll-gothicneo3 | 한국어 UI |
| Mono | source-code-pro | 코드 블록 |

- **색상**: oklch hue 280 (purple-blue) 서피스 + 앱별 액센트
  - Munseo = coral (`--primitive-coral`)
  - Umbracast = amber (`--primitive-amber`)
  - Sincheong = violet (`--primitive-violet`)
- **킷**: `glw6csk` (생태계 공용 `fmh4fod` 아님)

## Paper.design 워크플로우

이 프로젝트는 Paper.design MCP를 통해 비주얼 디자인 이터레이션을 수행한다.

### 코드 → Paper (푸시)
1. 컴포넌트를 구현한 후, `write_html`로 Paper 캔버스에 푸시
2. 전체 페이지가 아닌 개별 컴포넌트/섹션 단위로 푸시할 것
3. 아트보드 이름은 컴포넌트 이름과 일치시킬 것

### Paper → 코드 (풀)
1. 사용자가 Paper에서 비주얼 수정 후 "반영해줘"라고 요청하면:
2. `get_jsx`로 수정된 구조 확인
3. `get_computed_styles`로 변경된 스타일 값 확인
4. 변경사항을 코드에 반영

### 주의사항
- Paper 캔버스의 HTML/CSS는 참조용이며, 프로젝트 소스코드가 정본(source of truth)
- Paper에서의 수정은 "의도 전달"이지 코드 직접 반영이 아님
- 스타일 변경 시 디자인 토큰/변수 체계가 있다면 토큰 값을 우선 적용

---

## 정정 (2026-09-30 · fleet-4 실측)

- **배포는 CF Pages 가 아니다.** landing = Worker `modfolio-studio`(`apps/landing/wrangler.jsonc`,
  `@astrojs/cloudflare` 14 · Workers Static Assets), app = Worker `modfolio-studio-app`
  (`apps/app/wrangler.toml` — 2026-06-29 Pages 에서 이관). 둘 다 main push 로 Workers Builds 가 배포한다.
- **글꼴은 Adobe Fonts 킷이 아니라 v4 자가 호스팅이다.** 토큰(`--font-display` 등)은 Gambetta·Cabinet·
  Paperlogy·Pretendard·Sligoil 을 부르고, Typekit `glw6csk`(freight·acumin·aktiv…)를 부르는 토큰은 없다.
  그래서 두 앱의 `glw6csk` 링크와 jsDelivr «Pretendard Variable» 링크를 뺐다(렌더를 막는 죽은 바이트).
  글꼴은 `bun run fonts`(각 앱 — `@modfolio/fonts`, 가족 B + `--extra Gambetta`)로 해시 이름·페이지
  서브셋을 만들고 결과를 커밋한다. 위 «Adobe Fonts 킷: glw6csk 사용» 은 «`fmh4fod` 를 쓰지 않는다» 의
  뜻으로만 유효하다(quality-gate 가 그 문자열을 계속 막는다).
- landing 은 2026-08-09(47a2f37)부터 2026-09-30 까지 `/fonts.css` 링크가 Base.astro 의 JSDoc 주석
  안에 들어가 있어 **v4 글꼴이 한 번도 로드되지 않았다**(시스템 글꼴로 그려짐). fleet-4 에서 고쳤다.
- landing 페이지는 전부 prerender 다(Worker 미실행). Header 의 로그인 CTA 는 비자격 힌트 쿠키
  `studio_si`(`src/lib/signed-in-hint.ts`)를 인라인 스크립트가 읽어 고른다 — 서버 `locals.user` 는
  `/auth/*` SSR 경로에서만 채워진다.
