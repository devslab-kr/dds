# @devslab-kr/dds-icons

방향성 아이콘 소비자는 `dds-icon--directional` 클래스를 추가한다. 패키지의
`direction-policy.json`이 RTL에서 미러링할 아이콘과 물리 방향을 유지할
아이콘의 기준 목록이다.

🌐 [English](README.md)

DDS 아이콘 세트 — 아이콘당 SVG 소스 하나(24 그리드, `currentColor`, 라운드
캡)를 소비자가 실제로 필요로 하는 세 가지 형태로 출하합니다. 스펙 §3.7
(개정: [D-013](../../docs/decisions.md)).

| 산출물 | 임포트 | 용도 |
| --- | --- | --- |
| `dist/svg/*.svg` | `@devslab-kr/dds-icons/svg/phone.svg` | 빌드 파이프라인, `<img>`, 디자인 툴 |
| `dist/icons.svg` | `@devslab-kr/dds-icons/icons.svg` | 웹 스프라이트 — `<use href="…/icons.svg#dds-phone">` |
| `dist/icons.js` (+ `.d.ts`) | `@devslab-kr/dds-icons` | 요소를 직접 만드는 런타임(RN, `createElementNS` 렌더러, SSR) |

```js
import { icons } from "@devslab-kr/dds-icons";

const i = icons.phone; // { viewBox, strokeWidth, set, body }
```

```html
<!-- 인라인 — 주변 색을 상속합니다 -->
<button class="dds-iconbtn" aria-label="전화">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- icons.phone.body -->
  </svg>
</button>
```

## 두 개의 세트

- **core** (`svg/*.svg`, 스트로크 1.6) — 제품 UI. 이름은 기능형
  (`chevron-down`, `external-link`). AskLinq 위젯에서 물려받은 22개는
  철자를 그대로 유지합니다 — 이름을 바꾸면 라이브 카드 아이콘이 깨집니다.
- **site** (`svg/site/site-*.svg`, 스트로크 1.8) — devslab.kr 전용, 마케팅
  표면에서 32–40px로 크게 쓰이도록 그려진 세트. `site-` 접두는 이름의
  일부이고 폴더는 정리용입니다.

## 규칙 (`scripts/check-icons.mjs`가 기계적으로 강제 — 리뷰가 아니라 CI가 막습니다)

- `viewBox="0 0 24 24"`, `width`/`height` 24
- `fill="none"`, `stroke="currentColor"`, 라운드 캡·조인
- 파일 어디에도 색 리터럴 금지, body 안의 `stroke`/`fill`/`style` 오버라이드
  금지 — 색과 굵기는 언제나 상속입니다
- 스트로크 굵기는 세트의 값(코어 1.6 / site 1.8). 제3의 값이 보이면 다른
  세트에서 들어온 아이콘입니다
- 소문자 kebab-case 이름, 이름에 크기·색 금지

## 일부러 없는 것

React/Vue/RN 컴포넌트를 생성하지 않습니다. 스펙 §2대로 프레임워크 패키지는
그 프레임워크 제품이 실제로 존재할 때만 만듭니다 — 지금 모든 소비자가
만들어 쓸 수 있는 형태는 path 데이터 맵입니다.

라이브 갤러리: `preview/icons.html` (먼저 `pnpm build`).
