# Studio Visual Identity: Cinematic Contrast

## Brand Concept

"Cinematic Contrast" — 엔터테인먼트/유틸리티 그룹의 영화적 대비. 무거운 세리프 Display와 가벼운 산세리프 Body의 극적 긴장감.

## Adobe Fonts Kit

- **Kit ID**: `glw6csk` (Studio 전용. 생태계 공용 `fmh4fod` 아님)
- **로드**: `https://use.typekit.net/glw6csk.css`
- **font-display**: swap (Typekit 대시보드에서 설정)

## Typography Matrix

| 역할 | 폰트 | CSS 변수 | Fallback | 용도 |
|------|------|---------|----------|------|
| Display | Freight Display Pro | `--font-display` | Georgia (metric override) | 히어로, 섹션 제목 |
| Body | Acumin Pro | `--font-body` | Arial (metric override) | 본문, 설명 텍스트 |
| UI | Aktiv Grotesk | `--font-ui` | Arial (metric override) | 버튼, 라벨, 내비게이션 |
| Data | Sandoll GothicNeo3 | `--font-data` | Pretendard Variable | 한국어 UI 텍스트 |
| Mono | Source Code Pro | `--font-mono` | SF Mono | 코드 블록 |
| KR Serif | Sandoll MyeongjoNeo1 | `--font-kr-serif` | Pretendard Variable | 한국어 세리프 |

### CLS Prevention

각 웹폰트에 `@font-face` metric override 정의:
- `freight-display-fallback` (Georgia): ascent 95%, descent 25%, size-adjust 105%
- `acumin-fallback` (Arial): ascent 92%, descent 24%, size-adjust 98%
- `aktiv-fallback` (Arial): ascent 100%, descent 22%, size-adjust 100%

## Color System (oklch)

### 3-Tier Token Architecture

**Tier 1 — Primitives** (hue 280 purple-blue):
- `--primitive-void`: oklch(0.07) — 최심부 배경
- `--primitive-surface-1~3`: oklch(0.12~0.20) — 단계별 서피스
- `--primitive-text-high/mid/low`: oklch(0.93/0.68/0.45) — 텍스트 위계

**Tier 2 — Semantic** (역할 매핑):
- `--color-surface-0/raised/overlay/emphasis` — 서피스 계층
- `--color-text-1/2/3` — 텍스트 우선순위
- `--color-border-default/hover` — 인터랙티브 경계

**Tier 3 — Accent** (앱별 브랜드):

| 앱 | 색상 | 변수 | oklch |
|----|------|------|-------|
| Studio Primary / Munseo | Coral | `--color-app-munseo` | oklch(0.75 0.12 18) |
| Umbracast | Amber | `--color-app-umbracast` | oklch(0.85 0.12 85) |
| Sincheong | Violet | `--color-app-sincheong` | oklch(0.72 0.14 300) |
| Status Active | Mint | `--color-status-active` | oklch(0.82 0.1 170) |

## Layout Grammar

- **Grid**: 8pt spacing (`--space-1` ~ `--space-24`, 0.25rem ~ 6rem)
- **Max width**: 1280px (기본), 1000px (중간), 800px (좁은)
- **Padding**: `clamp(1.5rem, 5vw, 3rem)` — 반응형 수평 여백
- **Header**: 80px 고정
- **Type scale**: clamp 기반 유동 타이포 (hero 2.5~6rem, body 1~1.125rem)
- **Radius**: sm(6px), md(10px), lg(16px), xl(24px)

## Motion

- **Easing**: `--ease-smooth` (0.16, 1, 0.3, 1), `--ease-out` (0.33, 1, 0.68, 1)
- **Duration**: fast(0.15s), base(0.3s), slow(0.6s)
- **접근성**: `prefers-reduced-motion: reduce` — 전역 애니메이션/트랜지션 비활성화

## CSS Layer Order

```
@layer reset, base, tokens, components, utilities;
```

Reset → Base → Tokens(변수 정의) → Components(컴포넌트 스타일) → Utilities(유틸리티)
