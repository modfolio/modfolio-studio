<!-- ECOSYSTEM_START: auto-synced from modfolio-ecosystem, do not edit -->

# Modfolio 생태계 컨텍스트

> 이 섹션은 modfolio-ecosystem에서 자동 동기화됩니다. 직접 편집하지 마세요.

# modfolio-ecosystem — Global Knowledge

> 이 파일은 모든 modfolio 프로젝트에 동기화된다. 수정은 modfolio-ecosystem에서만.
> 상세 정보는 각 skill을 호출할 것.

## 생태계 개요

**Modfolio 생태계**는 15개 이상의 앱으로 구성된 SaaS 생태계. 각 앱은 독립 브랜드로 운영되며, 공통 인프라(SSO, 이벤트, 결제)를 공유.

- **조직**: github.com/modfolio
- **플랫폼**: 100% Cloudflare Edge Native (Workers + D1 + R2)
- **런타임**: Bun | **언어**: TypeScript (strict) | **린터**: Biome v2

## 3대 불변 원칙

1. **House of Brands** — 앱 간 UI 라이브러리 공유 금지. 각 앱은 독립 디자인 시스템 + 독립 기술 스택. 각 앱은 Brand Passport (`docs/brand-passport.md`)에 디자인 결정의 근거를 기록.
2. **Zero Physical Sharing** — 코드 공유는 SSO 토큰 / 데이터 스키마(`@modfolio/contracts`) / Webhook API로만.
3. **100% Cloudflare Edge Native** — Vercel, AWS, GCP 배제. CF Workers만.
4. **디자인 다양성** — 구조(토큰 명명, cascade layer, 접근성)만 공유한다. 색상값, 그림자, 모션, 타이포그래피, 레이아웃의 실제 값은 각 앱이 Brand Passport에 따라 자유롭게 결정한다.

## 도메인 아키텍처 (2-프로젝트 모델)

각 브랜드는 두 개의 독립 프로젝트로 분리:
- `domain.com` = 앱 (SvelteKit / SolidStart 등)
- `www.domain.com` = 랜딩 (Astro)

**entryMode**: `app-first` (앱 홈 직접) 또는 `landing-first` (302 redirect).
**인프라 앱**: 서브도메인 모델 (`*.modfolio.io`).

## 기술 스택 요약

## 관련 앱 (유니버설 + studio)

| App | Version | Status |
|-----|---------|--------|
| Modfolio Connect | 1.1.0 | active |
| Modfolio Pay | 0.7.0-design-evolution | active |
| Munseo | 0.2.0-sso | active |
| Umbracast | 1.1.0 | active |
| Sincheong | 0.4.0-sveltekit5 | active |

## 프로젝트 지식

# modfolio-studio — 프로젝트 지식

## 역할

**Entertainment/Utility Group Portal**. Modfolio Studio 계열 엔터테인먼트/유틸리티 앱들의 통합 랜딩 포탈.

## 기술 스택

| 경로 | 프레임워크 | 도메인 | CF 프로젝트 | 역할 |
|------|-----------|--------|------------|------|
| `apps/landing` | Astro SSR | studio.modfolio.io | modfolio-studio | 그룹 랜딩 포탈 |
| `apps/app` | SvelteKit 5 | lab.modfolio.io | modfolio-studio-app | Studio Lab (SSO 연동) |

- **DB**: 없음 (하위 앱들이 각자 DB 보유)
- **인증**: modfolio-connect SSO (OIDC PKCE)
- **배포**: CF Pages
- **버전**: `0.1.0`

## 하위 앱

| 앱 | 도메인 | 역할 |
|----|--------|------|
| Munseo | munseo.app | 문서 변환/관리 |
| Umbracast | umbracast.com | 오디오 변환/관리 |
| Sincheong | sincheong.app | 폼 빌더/관리 |

## 비주얼 아이덴티티: Cinematic Contrast

- **컨셉**: 엔터테인먼트 그룹의 영화적 대비 — 무거운 Display + 가벼운 Body
- **Adobe Fonts 킷**: `glw6csk` (생태계 공용 `fmh4fod` 아님)
- **폰트 역할**: freight-display-pro(Display), acumin-pro(Body), aktiv-grotesk(UI), sandoll-gothicneo3(한국어), source-code-pro(Mono)
- **색상**: oklch hue 280 (purple-blue) 서피스 + 앱별 액센트 (Munseo=coral, Umbracast=amber, Sincheong=violet)

## 구현된 기능

- 스크롤 기반 스토리텔링 랜딩 레이아웃 (vision-first restructure)
- 서브앱 카드 그리드 + 틸트 카드 애니메이션
- 서브앱 상세 페이지 (`/apps/[app]`)
- SSO 로그인 포탈 (Studio Lab)
- 3-tier 디자인 토큰 시스템
- 404, Privacy, Terms, Contact 페이지
- Adobe Fonts 타이포그래피 (Cinematic Contrast)


> (전체 내용: knowledge/projects/modfolio-studio.md)

<!-- ECOSYSTEM_END -->





















---

# modfolio-studio — 프로젝트 규칙

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

## Quality Gate (필수)

모든 작업 완료 후 반드시 실행. 통과하지 않으면 commit 불가:

```bash
bun run check && bun run typecheck
```

## Context Rot Prevention

메인 세션은 오케스트레이션 전용. 무거운 작업은 서브에이전트에서.

### 서브에이전트 활용 기준
- 파일 1-2개 수정: 메인 세션에서 직접
- 파일 3개 이상: 서브에이전트 필수
- 리서치/탐색: Explore (haiku)
- 코드 생성: 도메인별 Agent (sonnet)
- 리뷰: Agent Teams (3 reviewer)

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

## Skills (필요 시 호출)

### 참조형 (패턴/규칙 가이드)

| Skill | 용도 |
|-------|------|
| `/plan` | 기획 품질 기준 + Product Lens + Scope 결정 |
| `/deploy` | CF Pages 배포 |
| `/journal` | 개발 저널 기록 |
| `/ecosystem` | 도메인 맵 + 현황 |
| `/ops` | 시크릿, 계정, 이메일 |
| `/typography` | Adobe Fonts + Pretendard + CLS 방지 |
| `/design-tokens` | 3-tier 디자인 토큰 (구조 규칙 + 탐색 프로토콜) |
| `/motion-patterns` | 스프링 물리 모션 + 접근성 |
| `/ui-quality-gate` | UI 자가 검증 체크리스트 |
| `/layout-patterns` | 헤더/푸터/섹션 레이아웃 규격 |
| `/observability` | CF 트레이싱 + OTLP + SigNoz |
| `/harness-check` | 하네스 전체 점검 + 자동 수정 (소스 대조 검증) |
| `/preflight` | 세션 시작 전 종합 점검 (MCP, 의존성, lint, git, 보안, 환경) |

### 생성형 (Agent 오케스트레이션)

| Skill | 용도 |
|-------|------|
| `/component` | 토큰 제약 내 UI 컴포넌트 생성 |
| `/page` | 페이지 레이아웃 생성 |
| `/design` | Figma + Paper 양방향 디자인 파이프라인 |
| `/test` | 테스트 스위트 생성 |
| `/fix` | 품질 위반 자동수정 |
| `/generate-review` | 생성→리뷰 통합 파이프라인 |
| `/multi-review` | 3-agent 병렬 리뷰 |
| `/ralph-loop` | 자율 반복 개선 루프 |
| `/release` | 릴리즈 파이프라인 |
| `/security-scan` | OWASP Top 10 보안 감사 |
| `/retro` | 스프린트 회고 |

## Sub Agents

### 리뷰형 (읽기 전용)

| Agent | 역할 | 모델 |
|-------|------|------|
| `knowledge-searcher` | 지식베이스 검색/요약 | haiku |
| `ecosystem-auditor` | ecosystem.json vs 실제 상태 검증 | haiku |
| `code-reviewer` | 생태계 규칙 기반 코드 리뷰 | sonnet |
| `design-critic` | 디자인 토큰/레이아웃/모션 검증 | sonnet |
| `accessibility-auditor` | WCAG AA 접근성 검증 | sonnet |
| `architecture-sentinel` | 불변 원칙 + 생태계 규칙 검증 | sonnet |
| `visual-qa` | Playwright 기반 시각 검증 | sonnet |

### 생성형 (코드 생성/수정)

| Agent | 역할 | 모델 |
|-------|------|------|
| `component-builder` | UI 컴포넌트 생성 (Figma 연동) | sonnet |
| `page-builder` | 페이지 레이아웃 생성 | sonnet |
| `test-builder` | 테스트 스위트 생성 | sonnet |
| `security-hardener` | 보안 감사 + 자동수정 | sonnet |
| `quality-fixer` | 품질 위반 자동수정 (P0-P3 triage + 정공법) | sonnet |
| `innovation-scout` | 기술 스택 혁신성 감사 (Stability Filter) | sonnet |
| `design-engineer` | Figma 양방향 디자인 파이프라인 | opus |

## Model Routing

| 모델 | 용도 |
|------|------|
| **Opus** | 오케스트레이션, 디자인 판단, 복잡한 리팩토링 |
| **Sonnet** | 코드 생성, 수정, 테스트, 리뷰 (기본) |
| **Haiku** | Explore (탐색/검색) |

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

## 참조

- 지식: `knowledge/global.md`, `knowledge/projects/`
- Skills: `.claude/skills/` | Agents: `.claude/agents/`
- 규칙: `.claude/rules/` (파일 패턴별 자동 로드)
- MCP: context7, github, cloudflare, playwright, neon, svelte, figma, canva, paper, filesystem
