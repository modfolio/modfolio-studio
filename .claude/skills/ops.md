---
description: 시크릿, 계정, 이메일 관리
effort: medium
---

# Skill: 운영 — 시크릿, 계정, 이메일

## 시크릿 관리

- **도구**: Doppler
- **로컬 개발**: `doppler run -- bun dev` 또는 `.env.local`
- **프로덕션**: CF Pages 환경변수에 직접 주입
- **원칙**: 시크릿은 절대 코드에 커밋하지 않는다

## 계정

- **주 계정**: `mod@modfolio.co.kr` (Google Workspace)
- **GitHub**: `modfolio` org
- **Cloudflare**: 기존 계정
- **Doppler**: `mod@modfolio.io`

## Studio 관련 시크릿

| 키 | 용도 | 위치 |
|----|------|------|
| `NPM_TOKEN` | GitHub Packages (@modfolio/connect-sdk) | CF Pages env |
| `TYPEKIT_API_TOKEN` | Adobe Fonts API | Doppler (확인 필요) |
