---
description: 3-tier 디자인 토큰 구조 + 탐색 프로토콜
effort: medium
---

# Design Tokens — 3-Tier Architecture

> House of Brands 원칙에 따라 각 앱의 **값**은 다르지만 **구조와 명명 규칙**은 동일.

## 3계층 구조

```
Primitives (원시 값)
  ↓ 의미 부여
Semantic (역할 매핑)
  ↓ 브랜드 특화
Accent (강조/브랜드)
```

## CSS Cascade Layers

```css
@layer reset, base, tokens, components, utilities;
```

## 명명 패턴: `--{속성}-{역할}-{변형}`

| 카테고리 | 용도 | 예시 |
|---------|------|------|
| `surface` | 배경 | `--color-surface-0`, `--color-surface-raised` |
| `text` | 텍스트 | `--color-text-1`, `--color-text-2`, `--color-text-3` |
| `interactive` | 버튼/링크 | `--color-interactive-primary`, `--color-interactive-hover` |
| `status` | 상태 | `--color-status-active`, `--color-status-pending` |
| `accent` | 브랜드 | `--color-accent-primary`, `--color-accent-secondary` |

## 8pt Spacing Grid

```css
--space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
--space-4: 1rem; --space-6: 1.5rem; --space-8: 2rem;
```

## 하드코딩 금지

- 직접 `#ffffff`, `16px`, `rgb(0,0,0)` 사용 금지
- 반드시 CSS 변수 참조 (`var(--color-*)`, `var(--space-*)`)

## Studio 토큰 파일

`apps/landing/src/styles/tokens.css` 참조.
