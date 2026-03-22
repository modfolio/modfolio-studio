---
description: CF Pages 배포 가이드
effort: medium
---

# Skill: 배포

CF Pages 네이티브 GitHub 연동 기반 배포 전략.

## 원칙

**GitHub Actions 배포 워크플로우 금지. CF Pages 네이티브 GitHub 연동만 사용.**

## CF Pages 설정

```
source.type = "github"
source.config.owner = "modfolio"
source.config.repo_name = "modfolio-studio"
source.config.production_branch = "main"
build_config.build_command = "bun install --frozen-lockfile && bun run build"
build_config.destination_dir = "apps/landing/dist"
build_config.root_dir = ""
```

## CF Pages Critical Rule

**Direct Upload -> GitHub 연동 불가능.**
반드시 생성 시점에 GitHub 연결. 이미 Direct Upload으로 만든 프로젝트는 삭제 후 재생성.

## wrangler.jsonc 필수 설정

```jsonc
{
  "name": "modfolio-studio",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": "dist",
  "observability": {
    "logs": {
      "enabled": true,
      "head_sampling_rate": 1
    }
  }
}
```

## 환경변수

CF Pages 환경변수 (CF Dashboard에서 설정):

| 변수 | 용도 |
|------|------|
| `NPM_TOKEN` | GitHub Packages 인증 (@modfolio/connect-sdk) |

## 커스텀 도메인

```bash
# CF Dashboard에서 수동 추가:
# 1. Pages 프로젝트 → Custom domains → Add domain
# 2. DNS 존에서 CNAME 레코드 추가
#    studio.modfolio.io → modfolio-studio.pages.dev
```

## CF API

```bash
CF_ACCOUNT_ID=1b371ab22db7b19da66380e525fb1cc1

# Pages 프로젝트 목록
curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[].name'
```

## 배포 체크리스트

1. CF Pages 프로젝트 생성 (GitHub 연동 필수)
2. 빌드 명령어 + 출력 디렉토리 설정
3. 커스텀 도메인 연결 (studio.modfolio.io)
4. 환경변수 설정 (NPM_TOKEN)
5. GitHub push → 자동 빌드/배포 확인
