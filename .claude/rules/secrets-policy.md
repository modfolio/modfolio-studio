---
title: 시크릿 정책 — athsra 런타임 주입
applicability: 시크릿·토큰·키를 다룰 때 · 빈 .env 를 봤을 때 · 유출이 의심될 때
consumers: [all-agents]
related_canon: [secret-store, agent-auth-ux]
# `paths:` 없음 = 의도(상시 · 규범만). 로테이션·유출 절차·린트 사유는 canon secret-store.md 로 옮겼다(4.1.5).
---

# 시크릿 정책

**하드코딩 금지**. API 키, 토큰, 서명 키, DB 비밀번호, OAuth client secret, encryption salt — 전부.

## 보관 계층 (2026-05-03 v3 — athsra 기반 universe-wide 전환, Phase 1 active)

1. **dev — athsra**: master pw 1개 + Bearer token. 모든 secret 이 CF Worker (`athsra-worker.*.workers.dev`) 의 R2 ciphertext 로 저장. `~/.athsra/config.json` (workerUrl + machineId) + OS keyring (master pw + token). `.env` / `.env.keys` 폐기. 절차: canon `secret-store` v1.1+.
2. **prod 런타임 — Cloudflare native**: Workers Secrets (`wrangler secret put`), Pages environment variables (CF Dashboard), Secret Store (binding). athsra 는 dev/build/deploy CLI 시점에 `athsra run <repo> -- <cmd>` 으로 inject.
3. **`.env.local`** (개발자 개인, git 무시): 일시 override / 실험만. 절대 commit 금지. 권장: athsra `<repo>-local` project 로 분리.
4. **`.env.example`** (commit 대상): placeholder만. 실제 값 없음.
5. **dotenvx** (deprecated 2026-05-03 v3 전환): 8 repo migration 완료. 잔존 repo 는 `bun ~/code/athsra/scripts/migrate-package-json.ts` 로 일괄 변환.
6. **Doppler** (deprecated 2026-04-25): 과거 표준. 새 repo 는 도입 금지.

## athsra runtime-injection — AI 행동 규칙 (2026-06-30, "빈 .env ≠ 시크릿 없음")

athsra 는 **runtime 주입** 모델 — 시크릿은 `athsra run <repo> -- <cmd>` 또는 세션 진입 시 env 로 들어오고 **디스크에 영구 저장되지 않는다**(no-persistence = 보안 gold standard; local-sync·`.env` 캐시는 의도적 폐기). 그래서 `.env` 가 비거나 없는 건 **정상이고 예상된 상태**다.

**AI/agent 필수 행동** (반복 마찰 = "athsra-forgetting" 제거):
- **빈/부재 `.env` 를 보고 "시크릿 누락 → 사용자에게 인증 요청"으로 절대 결론짓지 않는다.** 가장 흔한 마찰. 시크릿은 athsra 에 있다.
- 시크릿이 필요하면 순서대로: ① 주입된 **세션 env**(`process.env.<KEY>`)부터 확인 → ② 없으면 `athsra run <repo> -- <cmd>`(주입 후 명령 실행) → ③ 단일 값은 `athsra get <repo> <KEY>`(값은 로그/응답 미노출).
- "인증/로그인 필요" 결론은 **`athsra doctor` 가 실제로 토큰/세션 부재를 보고할 때만**. 빈 `.env` 는 근거가 아니다.

**구조적 해결 (forgetting 자체 제거)**: 개발 세션을 `athsra run <repo> -- <launcher>` 로 시작 → 시크릿이 세션 env 에 상주 → AI 가 그냥 `process.env` 로 읽음(매번 `athsra run` 기억 불필요, 디스크 0). IDE/툴이 `.env` 파일을 강제하면 영구 캐시 대신 **tmpfs 에 쓰고 종료 시 wipe**. 상세: canon `secret-store.md`.

## 금지 패턴

- 테스트 코드에 실제 키 하드코딩 — 테스트 키라도 예외 없음
- 주석에 키 남기기 (`// key: sk-ant-...`)
- MCP config에 토큰 inline — `.mcp.json`에 placeholder만, 실제 값은 env
- Supertone / Toss / Resend / HuggingFace token 리터럴

## 상세는 canon

로테이션 주기 표 · 유출 시 절차(athsra `rotate-master`·`revoke`·GLOBAL_SALT) · 검출 · 린트 정합(`noUndeclaredEnvVars` off 사유) · 관련 skill 은 `knowledge/canon/secret-store.md` §«secrets-policy.md 에서 옮긴 상세» 에 있다. **유출이 의심되면 그 절을 먼저 연다.** (Bearer token revoke 는 D1 이라 **즉시 유효** — «60초 전파» 가 아니다.)
