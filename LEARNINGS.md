# LEARNINGS.md

> 이 파일은 공식 Claude Code 기능이 아닌 커스텀 컨벤션입니다.
> 자동 로드되지 않으며, SessionStart 훅의 안내로 참조합니다.
> Auto Memory (세션 간 자동 지속)와 별도로, git 커밋하여 프로젝트 간 공유합니다.

## Raw Observations

세션에서 발견한 것을 즉시 기록. `[날짜] [프로젝트] 내용` 형식.

- [2026-07-02] [studio] 랜딩 `middleware.ts` 가 Connect 세션을 `/auth/*` 경로에서만 해석하고 나머지 경로엔 `locals.user=null` 하드코딩 → Header 가 매 페이지에서 `locals.user` 로 CTA(로그인 vs Open Lab) 를 고르므로 로그인 사용자가 홈/apps/contact 에서 항상 "로그인" 을 보고 OIDC 재진입. Astro SDK middleware 는 protectedPaths 강제가 없음(그건 sveltekit/nextjs/nuxt 전용) — 세션 검증 + refresh rotation 후 `locals.user` 설정만 함. 공개 사이트에선 전역 실행이 정답. **교훈: 세션 컨텍스트를 read 하는 middleware 를 경로로 gate 하면 그 컨텍스트에 의존하는 전역 UI 가 조용히 깨진다.**
- [2026-07-02] [studio] `scripts/quality-gate.sh` 의 changed-files 분기가 `git status | grep ...` 파이프라인을 `FILES=$(...)` 로 캡처하는데, 변경된 코드파일이 없으면 마지막 grep 이 exit 1 → `set -o pipefail` + `set -e` 로 `[[ -z "$FILES" ]]` 빈-가드 도달 전에 스크립트 abort. 결과: clean tree 에서 `bun run quality:all` 이 빈 에러로 false-fail. `{ ...; } || true` 로 감싸 해결. **교훈: pipefail 하에서 "없으면 빈 결과" 를 의도한 grep 파이프라인은 `|| true` 없으면 빈-가드를 무력화한다.**
- [2026-07-02] [studio] deps 마이너 bump(kit 2.55→2.69) 가 `@cloudflare/workers-types` transitive 제공을 끊음 → tsconfig `"types"` 가 미설치 패키지 참조로 svelte-check warn. baseline 이 green 이던 건 그 패키지가 *우연히* transitive 로 있었기 때문. **교훈: tsconfig `"types"` 에 명시한 패키지는 direct devDependency 로 두어야 transitive drift 에 안 깨진다.**

## Consolidated Principles

Raw Observations에서 반복 패턴이 50개 이상 축적되면 원칙으로 승격.

(아직 비어 있음)
