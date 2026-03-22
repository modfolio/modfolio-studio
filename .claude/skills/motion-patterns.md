---
description: 스프링 물리 모션 + 접근성
effort: medium
---

# Motion Patterns — 스프링 물리 + 접근성

## Astro에서의 모션

Astro는 CSS `@keyframes` + `animation-delay`만 사용.

### 순차 등장 패턴

```css
.item { animation: fadeIn 0.5s ease both; }
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 80ms; }
.item:nth-child(3) { animation-delay: 160ms; }
```

간격: 60-120ms가 자연스러움.

## 성능 규칙

1. `transform`과 `opacity`만 애니메이션
2. `width`, `height`, `top`, `left` 등 Layout 속성 애니메이션 금지
3. 시각 효과에 `pointer-events: none`

## 접근성 필수

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## CSS 변수 사용

```css
transition: transform var(--dur-fast) var(--ease-smooth);
```

모든 duration/easing은 토큰 참조.
