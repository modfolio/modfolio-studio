# 20260701 — Completeness/Robustness Round (scored-enhancement pass)

> category: decision · tags: gate-integrity, type-safety, prerender, og-image, a11y, robustness
> 목표: 이미 구현된 기술의 **완결성/견고성**을 정공법으로 끌어올린다 (net-new 기능 아님).
> 방법: 증거기반 gap 평가 → score(0–5 ×5 = /25) → 상위 정공법 채택 → `quality:all` green + 라이브 검증.

## 평가 요약 (evidence-based)

레포는 **얇은 스캐폴드가 아니다** — 완성도 높은 2-app 모노레포:
- `apps/landing` (Astro SSR, studio.modfolio.io) — 8 페이지, SSO 4-handler, 3-tier 토큰, 404/privacy/terms/contact, OG/Twitter meta, CSS-only 모바일 메뉴.
- `apps/app` (SvelteKit 5, lab.modfolio.io) — Connect SSO portal, branded error boundary, 4-state(loading 없음·empty·error·populated) portal, prefers-reduced-motion 전역.
- TODO/FIXME **0건**, `as any` **0건**, `as unknown as` 2건(둘 다 hooks.server.ts — 본 라운드에서 근본 제거).
- 날짜/timezone 로직 **없음** → KST 정합성 N/A (grep 공집합으로 확인).

### Gate-integrity 검증 (3-probe, 본 라운드 핵심)
주입식 오류로 false-green 부재 확인:
- astro check: 주입 시 `error ts(2322)` + exit 1 ✓
- svelte-check: 주입 시 exit 1 ✓
- biome check: 주입 `==` → `Found 3 errors` exit 1 ✓
- git revert 후 working tree clean ✓

**발견된 gate 구멍(거짓-green)**: 루트 `typecheck` 가 echo no-op (`"astro check disabled until libuv/css-tree fix"`) 였고, `quality:all` 은 이 no-op 을 호출 → **landing(Astro) 타입이 aggregate gate 에서 전혀 검증되지 않음**. 실측 결과 astro check 는 정상 작동(0/0/0, 주입오류 포착) → "libuv 차단" 주석은 **stale**. 본 라운드에서 `typecheck` 를 실제 astro check 로 wiring(C2).

## Scored rubric (Impact·Severity·정공법-fit·Effort⁻¹·Evidence, 각 0–5)

| # | Candidate | Imp | Sev | Fit | Eff⁻¹ | Evi | /25 | Rank | Disp |
|---|-----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| C2 | `quality:all` 에 astro check 누락 → landing 타입 미검증(false-green) 폐쇄 | 5 | 5 | 5 | 5 | 5 | **25** | 1 | ADOPT |
| C1 | `hooks.server.ts` `as unknown as` ×2 제거 → `createSvelteKitAuth<App.Locals>` generic | 4 | 4 | 5 | 5 | 5 | **23** | 1 | ADOPT |
| C3 | `[app].astro` build WARN — `getStaticPaths` ignored (server mode) → `prerender=true` | 4 | 4 | 5 | 5 | 5 | **23** | 1 | ADOPT |
| C4 | `og.png` 부재(meta 4곳 참조, 라이브 404) → 브랜드 정합 1200×630 생성 | 4 | 4 | 4 | 4 | 5 | **21** | 4 | ADOPT |
| C6 | portal avatar `(name ?? email)[0]` — 빈문자열 name 시 crash(`??` 가 ""미포착) | 4 | 3 | 5 | 5 | 4 | **21** | 4 | ADOPT |
| C7 | 404.astro `<main>` `id="main"` 누락 → skip-link 타겟 깨짐(404만) | 3 | 3 | 5 | 5 | 5 | **21** | 4 | ADOPT |
| C10 | `platform-adapter.json` clientId `modfolio-studio`→`studio`(실 SSO/registry 불일치) | 3 | 3 | 5 | 5 | 5 | **21** | 4 | ADOPT |
| C11 | stale 루트 `typecheck` no-op 제거(C2 와 결합) | 3 | 2 | 5 | 5 | 5 | **20** | 5 | ADOPT |
| C5 | app `favicon.png` 부재(app.html 참조, 라이브 404) → favicon.svg 정합 | 3 | 3 | 4 | 5 | 5 | **20** | 5 | ADOPT |
| Cb | biome `recommended:true`→`preset:"recommended"`(2.5.1 deprecation info 제거) | 2 | 2 | 5 | 5 | 5 | **19** | — | ADOPT(coupled) |
| C8 | landing `apps.ts`+`app-details.ts` 3중 데이터 중복 통합(drift 위험) | 4 | 3 | 5 | 3 | 5 | **20** | 5 | DEFER |
| C9 | 모바일 버거 `aria-expanded`/`aria-controls` 누락(WCAG 2.2 4.1.2) | 3 | 3 | 4 | 4 | 4 | **18** | 9 | DEFER |
| C12 | Header `aria-current` 로직 — `/#manifesto` 영구 미매치, `/apps` 과매치 | 2 | 2 | 4 | 4 | 4 | **16** | 12 | DEFER |
| C13 | 미사용 `@modfolio/contracts` 의존 제거 | 2 | 1 | 3 | 4 | 5 | **15** | 13 | DEFER |
| C14 | brand-passport.md 스텁(placeholder) 채우기 | 2 | 2 | 3 | 3 | 5 | **15** | 13 | DEFER |
| C15 | `[app].astro` bad-id → home redirect 대신 404(SEO) | 2 | 2 | 3 | 4 | 4 | **15** | 13 | DEFER→C3가 부수해결 |

## ADOPTED (구현 완료)

1. **C2+C11 (gate 구멍 폐쇄)** — `package.json`: `typecheck` = `cd apps/landing && bun run check` (echo no-op 제거). `quality:all` 이 이제 landing astro check 를 실제 실행 → 두 앱 모두 aggregate gate 가 타입 검증.
2. **C1 (type-escape 근본 제거)** — `connect.ts`: `createSvelteKitAuth<App.Locals>(...)`. `hooks.server.ts`: `as unknown as` ×2 삭제, `auth.handle({ event, resolve })` 직접 전달. svelte-check 0/0 로 cast 불필요 실증.
3. **C3 (build WARN 제거)** — `[app].astro`: `export const prerender = true`. munseo/umbracast/sincheong 3 페이지가 빌드 시 static HTML 로 prerender(이전엔 getStaticPaths 무시 + per-req SSR). 부수효과: unknown app-id 가 이제 정상 404(이전 302→home).
4. **C4 (OG 이미지)** — `apps/landing/public/og.png` 1200×630. 브랜드 정합(Cinematic Contrast): void surface + coral/amber/violet horizon glow + 디스플레이 헤드라인 + tri-color accent bar + domain. oklch→sRGB hex 정확 변환 후 `@resvg/resvg-js`(scratch-only, 레포 의존성 미추가)로 렌더. 빌드 시 `dist/client/og.png` 확인.
5. **C5 (app favicon)** — `apps/app/static/favicon.svg`(landing 와 동일 "S" 마크, 동일 브랜드/제품). `app.html` `favicon.png`→`favicon.svg`(`image/svg+xml`).
6. **C6 (portal robustness)** — `displayName`/`avatarInitial` `$derived` 추가. `||` + `.trim()` + `"?"` 최종 fallback 으로 빈문자열 name crash 제거. avatar badge `aria-hidden`(장식 이니셜).
7. **C7 (skip-link)** — 404.astro `<main id="main">`. (전 페이지 id=main 일관성 확보 — 404 만 누락이었음.)
8. **C10 (manifest 정합)** — `platform-adapter.json` clientId `studio`(코드·Connect registry·commit 81dad80 와 일치).
9. **Cb (biome deprecation)** — `biome.json` `preset:"recommended"`. `biome check` info 0.

## Gate evidence
- `bunx biome check .` → `Checked 39 files. No fixes applied.` (0 errors, 0 info)
- `bun run typecheck`(landing astro) → `Result (20 files): 0 errors, 0 warnings, 0 hints`
- `bun run typecheck:app`(svelte-check) → `0 errors and 0 warnings`
- `bun run quality:all` → **EXIT 0 / PASS — 위반 없음**
- `bun run build`(landing) → EXIT 0, `prerendering static routes`, **no getStaticPaths WARN**, og.png+favicon.svg in dist, 3 app html prerendered
- `bun run build:app`(svelte) → EXIT 0, no warnings

## DEFERRED (근거)
- **C8** (3중 데이터 중복 통합, 20/25): House-of-Brands 가 landing↔app 물리공유 금지(gate P0). landing 내부(apps.ts+app-details.ts) 통합은 가능하나 `[app].astro` features 동작 회귀 위험 → 독립 변경으로 분리.
- **C9/C12** (a11y 보강): 가치 있으나 severity 중간, 별도 a11y 라운드.
- **C13** (미사용 contracts dep): webhook 이벤트 staging 가능성 — 제거 전 ecosystem 의도 확인 필요.
- **C14** (brand-passport 스텁): 문서 작업, "구현된 기술 완결" 범위 밖 + 문서 proactive 생성 지양.

## 라이브 before/after
| URL | before | after(예상) |
|-----|:--:|:--:|
| studio.modfolio.io (+/apps,/contact,/privacy,/terms) | 200 | 200 |
| studio.modfolio.io/og.png | **404** | **200** |
| studio.modfolio.io/apps/<unknown> | 200(302→home) | **404** |
| lab.modfolio.io (+/portal) | 200 | 200 |
| lab.modfolio.io/favicon.png→.svg | **404** | **200**(favicon.svg) |
