# Skill: /plan — 구현 계획 작성

Planner가 구현 계획을 작성하는 가이드.

## 파일 위치

```
docs/plan/YYYYMMDD-###-slug.md
```

## 템플릿

```markdown
# YYYYMMDD-###-slug — Plan

## Background

[변경이 필요한 이유와 맥락]

## Intent

[이 plan이 달성하려는 핵심 목적. Builder가 판단의 기준으로 사용]

## Scope

[변경 대상 파일/디렉토리 목록]

- `path/to/file.ts` — [변경 내용]
- ...

## Acceptance Criteria

- [ ] AC-1: [검증 가능한 조건]
- [ ] AC-2: [검증 가능한 조건]
- [ ] Quality Gate: PASS

## Task Breakdown

1. [세부 구현 단계]
2. ...

## Open Questions

[Builder의 판단에 맡기는 사항. 없으면 "None"]

1. ...
```

## 작성 원칙

1. **Intent가 핵심**: Builder는 scope가 아니라 intent에 충실한다.
2. **AC는 검증 가능**: "좋은 UX" (X) → "로그인 후 3초 내 대시보드 표시" (O)
3. **Open Questions는 명시적**: 판단을 위임하면 명시한다. 암묵적 위임은 혼란을 일으킨다.
4. **Quality Gate**: `CLAUDE.md`의 Quality Gate 명령어를 AC 마지막에 포함.

## 영향 분석 (해당 시)

스키마 변경, SSO 설정 변경, 계약 변경이 포함되면:

```markdown
## Impact Analysis

- 영향받는 앱: [앱 목록]
- Breaking change: Yes/No
- ecosystem.json 갱신 필요: Yes/No
```
