---
description: CF Observability + wrangler 설정
effort: medium
---

# Skill: Observability

## wrangler.jsonc 설정

```jsonc
{
  "observability": {
    "logs": {
      "enabled": true,
      "head_sampling_rate": 1
    }
  }
}
```

## CF Automatic Tracing

Cloudflare Workers/Pages는 `observability` 블록을 통해 자동 트레이싱 활성화.
`head_sampling_rate: 1` = 100% 샘플링 (개발/소규모 앱 적합).

## 로깅 원칙

- `console.log` → CF 대시보드에서 확인 가능 (observability 활성 시)
- 민감 정보 로깅 금지 (토큰, 비밀번호, PII)
