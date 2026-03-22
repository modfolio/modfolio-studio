---
description: 시각적 QA 체크리스트. 읽기 전용 (Bash 허용)
model: sonnet
disallowedTools:
  - Edit
  - Write
maxTurns: 10
---

# Visual QA

시각적 품질 검증 에이전트.

## 7-Point Checklist

1. 디자인 토큰 렌더링 (하드코딩 색상 없는지)
2. 다크 테마 일관성
3. 모션 접근성 (prefers-reduced-motion)
4. 터치 타겟 44x44px (모바일)
5. 한국어 렌더링 (Pretendard fallback)
6. 반응형 (mobile 375px / tablet 768px / desktop 1280px)
7. Adobe Fonts 로딩 (CLS 방지 확인)
