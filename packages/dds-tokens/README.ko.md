# @devslab/dds-tokens

🌐 [English](README.md)

레포 루트의 단일 소스(`tokens/*.json`, W3C Design Tokens 포맷)에서 모든 소비
형태를 생성하는 DDS 토큰 패키지 (스펙 §2). `pnpm build` 산출물:

| 산출물 | 임포트 | 소비자 |
| --- | --- | --- |
| `dist/tokens.css` | `@devslab/dds-tokens/tokens.css` | 모든 웹 표면. `--dds-*` 커스텀 프로퍼티 — 라이트는 `:root`, 다크는 `[data-theme="dark"]` |
| `dist/tailwind/theme.css` | `@devslab/dds-tokens/tailwind/theme.css` | Tailwind v4 (`@theme`) |
| `dist/tailwind/preset.js` / `.cjs` | `@devslab/dds-tokens/tailwind/preset` | Tailwind v3 (`presets: [...]`) |
| `dist/tokens.ts` (+ `tokens.js` / `tokens.d.ts`) | `@devslab/dds-tokens` | RN·런타임 코드 — 단위 없는 숫자 (웹 px, RN pt) |
| `dist/ionic.css` | `@devslab/dds-tokens/ionic.css` | Ionic 앱 — `--ion-*`를 `--dds-*`에 매핑: 브랜드색(`primary` + `-rgb`/`-shade`/`-tint`/`-contrast`), 상태색 3종 + 각 `-contrast`, 페이지 배경·텍스트·보더, 폰트, 앱 크롬(`item`·`toolbar`·`tab-bar`·`card`) |

## 사용 노트

- **로드 순서.** `tokens.css`가 먼저. `theme.css`/`ionic.css`는 그 변수를
  참조합니다. Tailwind 색 유틸리티는 `var(--dds-*)`를 통해 해석되므로
  런타임 테마를 따라갑니다.
- **다크 모드.** `<html>`(또는 임의 서브트리)에 `data-theme="dark"`.
  `data-theme="light"`로 서브트리를 라이트에 되고정할 수도 있습니다(트윈
  패널·테마 고정 임베드). 미디어 쿼리는 내보내지 않습니다 — 자동 추종
  여부는 devslab.kr 토글과 마찬가지로 소비자의 몫입니다.
- **원시 팔레트는 CSS에 없습니다.** 컴포넌트는 시맨틱 토큰만 쓸 수 있고
  (스펙 §3.1), CSS가 싣지 않은 것은 하드코딩할 수도 없습니다. 팔레트 값이
  필요한 매핑 정의 코드는 `tokens.ts`에서 가져갑니다.
- **Tailwind 네이밍.** 색 이름은 시맨틱 경로 그대로: `bg-bg-brand`,
  `text-text-primary`, `border-border-default`. 평평하게("brand") 만들면
  충돌합니다 — `color.bg.brand`와 `color.text.brand`는 다른 값입니다.
  spacing은 오버라이드하지 않습니다: Tailwind 기본 0.25rem 그리드가 DDS
  4px 스케일과 정확히 일치합니다 (`p-1`=4px … `p-16`=64px, `space.2`=`p-0.5`).

## 스크립트

- `pnpm build` — Style Dictionary v4가 `tokens/*.json` 그래프를 해석하고,
  명시적 포매터가 산출물을 냅니다 (모르는 `$type`은 빌드 실패).
- `pnpm check` — 토큰 JSON 검증(리프 형태, 참조 해석, 라이트/다크 패리티,
  값 형태) + 생성된 TS에 `tsc --strict`.

레포 레벨 `pnpm verify`는 추가로 `scripts/check-docs-sync.mjs`를 돌려
`docs/design-system*.md`·`preview/index.html`이 토큰 값과 어긋나면 CI를
실패시킵니다.
