#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# modfolio-studio Quality Gate
# 결정론적 CLAUDE.md 규칙 검증
# Usage: bash scripts/quality-gate.sh [--all]
# ============================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIOLATIONS=0
OUTPUT=""

# ── Helpers ──

red()    { printf '\033[0;31m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }
green()  { printf '\033[0;32m%s\033[0m\n' "$1"; }

report() {
  local severity="$1" file="$2" line="$3" msg="$4"
  # 경로를 REPO_ROOT 기준 상대 경로로 변환
  local rel="${file#"$REPO_ROOT"/}"
  OUTPUT+="[$severity] $rel:$line — $msg"$'\n'
  VIOLATIONS=$((VIOLATIONS + 1))
}

# ── File Collection ──

if [[ "${1:-}" == "--all" ]]; then
  FILES=$(find "$REPO_ROOT/apps" -type f \( -name '*.ts' -o -name '*.svelte' -o -name '*.astro' -o -name '*.css' \) \
    -not -path '*node_modules*' -not -path '*/.svelte-kit/*' -not -path '*dist/*' | sort)
else
  FILES=$(cd "$REPO_ROOT" && git status --porcelain 2>/dev/null \
    | grep -E '^\s*[AMRC?]' \
    | awk '{print $NF}' \
    | grep -E '\.(ts|svelte|astro|css)$' \
    | while IFS= read -r f; do echo "$REPO_ROOT/$f"; done \
    | sort)
fi

if [[ -z "$FILES" ]]; then
  green "No code files to check."
  exit 0
fi

# ── Categorize ──

LANDING_FILES=""
APP_FILES=""
STYLE_FILES=""
NON_TEST_FILES=""

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue

  case "$f" in
    */apps/landing/*) LANDING_FILES+="$f"$'\n' ;;
    */apps/app/*)     APP_FILES+="$f"$'\n' ;;
  esac

  case "$f" in
    *.css|*.astro|*.svelte) STYLE_FILES+="$f"$'\n' ;;
  esac

  case "$f" in
    *.test.ts|*.spec.ts|*__tests__*) ;;
    *) NON_TEST_FILES+="$f"$'\n' ;;
  esac
done <<< "$FILES"

# ============================================================
# UNIVERSAL RULES — 모든 코드 파일
# ============================================================

# ── P0: 오류 우회 금지 ──
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue

  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "오류 우회: $(echo "$content" | xargs)"
  done < <(grep -nE '@ts-ignore|@ts-nocheck|biome-ignore|eslint-disable' "$f" 2>/dev/null || true)
done <<< "$FILES"

# ── P0: as any 금지 (테스트 제외, as unknown as 제외) ──
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue

  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    # as unknown as 는 합법적 타입 좁히기
    echo "$content" | grep -q 'as unknown as' && continue
    report "P0" "$f" "$line" "타입 탈출: as any — 정확한 타입 사용"
  done < <(grep -nE '\bas\s+any\b' "$f" 2>/dev/null || true)
done <<< "$NON_TEST_FILES"

# ── P0: 하드코딩 시크릿 ──
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue
  # .env, example, placeholder, test 파일 제외
  case "$f" in *.env*|*example*|*placeholder*|*.test.*|*.spec.*) continue ;; esac

  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "하드코딩 시크릿 의심"
  done < <(grep -niE '(api_key|apikey|api_secret|secret_key|private_key|password)\s*[:=]\s*["\x27][A-Za-z0-9+/=_-]{16,}' "$f" 2>/dev/null || true)
done <<< "$FILES"

# ── P0: House of Brands — 공유 UI 라이브러리 임포트 금지 ──
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue

  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "House of Brands 위반: 공유 UI 라이브러리 임포트"
  done < <(grep -nE '@modfolio/(ui|components|design-system|shared)' "$f" 2>/dev/null || true)
done <<< "$FILES"

# ── P0: 모노레포 경계 위반 ──
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue

  case "$f" in
    */apps/landing/*)
      while IFS=: read -r line content; do
        [[ -z "$line" ]] && continue
        report "P0" "$f" "$line" "모노레포 경계 위반: landing → app 임포트"
      done < <(grep -nE "from ['\"].*apps/app|from ['\"].*\.\./app" "$f" 2>/dev/null || true)
      ;;
    */apps/app/*)
      while IFS=: read -r line content; do
        [[ -z "$line" ]] && continue
        report "P0" "$f" "$line" "모노레포 경계 위반: app → landing 임포트"
      done < <(grep -nE "from ['\"].*apps/landing|from ['\"].*\.\./landing" "$f" 2>/dev/null || true)
      ;;
  esac
done <<< "$FILES"

# ============================================================
# STYLE RULES — .css, .astro, .svelte
# ============================================================

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue
  # SVG 파일 제외 (파비콘 등 raw hex 정당)
  [[ "$f" == *.svg ]] && continue

  # ── 블록 컨텍스트 감지 (noscript, prefers-reduced-motion) ──
  NOSCRIPT_LINES=$(awk '/<noscript/{ b=1 } b{ print NR } /<\/noscript/{ b=0 }' "$f" 2>/dev/null || true)
  REDUCED_MOTION_LINES=$(awk '/prefers-reduced-motion/{ b=1; d=0 } b && /{/{ d++ } b && /}/{ d--; if(d<=0) b=0 } b{ print NR }' "$f" 2>/dev/null || true)

  # ── P1: 하드코딩 색상 ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    # 정당한 예외 필터링
    echo "$content" | grep -qE 'var\(' && continue
    echo "$content" | grep -qE '^\s*/[/*]' && continue
    echo "$content" | grep -qE '^\s*\*' && continue
    echo "$content" | grep -q 'theme-color' && continue
    echo "$content" | grep -q 'content="#' && continue
    # noscript 블록 내부 (CSS 변수 로드 안 됨)
    echo "$NOSCRIPT_LINES" | grep -q "^${line}$" && continue
    # CSS 변수 정의 컨텍스트 (소비가 아닌 토큰 선언)
    echo "$content" | grep -qE -- '--[a-z]+-' && continue
    report "P1" "$f" "$line" "하드코딩 색상 — CSS 변수 사용: $(echo "$content" | xargs | head -c 80)"
  done < <(grep -nE '#[0-9a-fA-F]{3,8}\b|[^-]rgb\(|[^-]rgba\(|[^-]hsl\(|[^-]hsla\(|[^-]oklch\(' "$f" 2>/dev/null || true)

  # ── P1: 하드코딩 font-family ──
  # @font-face 블록 내 font-family는 정의이므로 제외 (항상 따옴표로 감싸짐)
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    echo "$content" | grep -qE 'var\(' && continue
    echo "$content" | grep -qE '^\s*/[/*]' && continue
    # CSS 변수 정의 컨텍스트
    echo "$content" | grep -qE -- '--font-' && continue
    # @font-face 정의: font-family: "name" (따옴표 = 정의, 소비 아님)
    echo "$content" | grep -qE 'font-family\s*:\s*"' && continue
    # CSS 키워드
    echo "$content" | grep -qE 'inherit|unset|initial' && continue
    report "P1" "$f" "$line" "하드코딩 font-family — CSS 변수 사용"
  done < <(grep -nE 'font-family\s*:' "$f" 2>/dev/null | grep -v 'var(' || true)

  # ── P1: !important 금지 ──
  if [[ "$f" == *.css ]]; then
    while IFS=: read -r line content; do
      [[ -z "$line" ]] && continue
      # prefers-reduced-motion 블록 내 !important는 정당한 접근성 패턴
      echo "$REDUCED_MOTION_LINES" | grep -q "^${line}$" && continue
      report "P1" "$f" "$line" "!important 사용 금지"
    done < <(grep -n '!important' "$f" 2>/dev/null || true)
  fi
done <<< "$STYLE_FILES"

# ============================================================
# ASTRO RULES — apps/landing/**/*.astro
# ============================================================

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue
  [[ "$f" != *.astro ]] && continue

  # ── P2: client:load 과사용 (참고) ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P2" "$f" "$line" "client:load — client:idle 또는 client:visible 검토"
  done < <(grep -n 'client:load' "$f" 2>/dev/null || true)
done <<< "$LANDING_FILES"

# ============================================================
# SVELTEKIT 5 RULES — apps/app/**/*.svelte
# ============================================================

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue
  [[ "$f" != *.svelte ]] && continue

  # ── P0: export let → $props() ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "Svelte 4: export let → \$props()"
  done < <(grep -nE '^\s*export\s+let\s' "$f" 2>/dev/null || true)

  # ── P0: <slot/> → {@render children()} ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "Svelte 4: <slot/> → {@render children()}"
  done < <(grep -nE '<slot\s*/?>' "$f" 2>/dev/null || true)

  # ── P0: on:event → onevent ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "Svelte 4: on:event → onevent"
  done < <(grep -nE '\bon:[a-z]+=' "$f" 2>/dev/null || true)

  # ── P0: createEventDispatcher → callback props ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "Svelte 4: createEventDispatcher → callback props"
  done < <(grep -n 'createEventDispatcher' "$f" 2>/dev/null || true)

  # ── P0: $: reactive → $derived/$effect ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "Svelte 4: \$: reactive → \$derived() 또는 \$effect()"
  done < <(grep -nE '^\s*\$:\s' "$f" 2>/dev/null || true)

  # ── P0: $$props, $$restProps → $props() spread ──
  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "Svelte 4: \$\$props/\$\$restProps → \$props() spread"
  done < <(grep -nE '\$\$props|\$\$restProps' "$f" 2>/dev/null || true)
done <<< "$APP_FILES"

# ============================================================
# STUDIO VISUAL IDENTITY
# ============================================================

# ── P0: 잘못된 Adobe Fonts kit ID ──
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue

  while IFS=: read -r line content; do
    [[ -z "$line" ]] && continue
    report "P0" "$f" "$line" "잘못된 Typekit kit: fmh4fod → glw6csk"
  done < <(grep -n 'fmh4fod' "$f" 2>/dev/null || true)
done <<< "$FILES"

# ── P0: 전역 prefers-reduced-motion 존재 확인 ──
LANDING_TOKENS="$REPO_ROOT/apps/landing/src/styles/tokens.css"
APP_CSS="$REPO_ROOT/apps/app/src/app.css"

if [[ -f "$LANDING_TOKENS" ]]; then
  if ! grep -q 'prefers-reduced-motion' "$LANDING_TOKENS"; then
    report "P0" "$LANDING_TOKENS" "0" "전역 prefers-reduced-motion fallback 누락"
  fi
fi

if [[ -f "$APP_CSS" ]]; then
  if ! grep -q 'prefers-reduced-motion' "$APP_CSS"; then
    report "P0" "$APP_CSS" "0" "전역 prefers-reduced-motion fallback 누락"
  fi
fi

# ============================================================
# RESULTS
# ============================================================

echo ""
echo "═══════════════════════════════════════"
echo "  Quality Gate — modfolio-studio"
echo "═══════════════════════════════════════"
echo ""

if [[ $VIOLATIONS -eq 0 ]]; then
  green "PASS — 위반 없음."
  exit 0
else
  P0_COUNT=$(echo "$OUTPUT" | grep -c '^\[P0\]' || true)
  P1_COUNT=$(echo "$OUTPUT" | grep -c '^\[P1\]' || true)
  P2_COUNT=$(echo "$OUTPUT" | grep -c '^\[P2\]' || true)

  red "FAIL — $VIOLATIONS건 위반:"
  echo "  P0 (반드시 수정): $P0_COUNT"
  echo "  P1 (수정 권장):   $P1_COUNT"
  echo "  P2 (참고):        $P2_COUNT"
  echo ""
  echo "$OUTPUT"

  # P2만 있으면 차단하지 않음
  if [[ $P0_COUNT -gt 0 ]] || [[ $P1_COUNT -gt 0 ]]; then
    exit 1
  else
    yellow "P2 참고 사항만 — 차단하지 않음."
    exit 0
  fi
fi
