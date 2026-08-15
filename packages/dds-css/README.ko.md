# @devslab-kr/dds-css

🌐 [English](README.md)

DDS CSS 컴포넌트 레이어 — 클래스 기반, 프레임워크 중립 (스펙 §2: 코어는 CSS,
React/Vue/Ionic/SSR은 소비자). 스펙 §4.3 v1 인벤토리: **Button, IconButton,
TextField, Textarea, Select, Checkbox/Radio, Switch, Badge, Chip, Avatar,
Spinner, Skeleton, Divider, Card, ListRow, Tabs, Dialog, Toast, Tooltip,
EmptyState** (BottomSheet은 Dialog의 네이티브 짝 — Phase 3).

```html
<link rel="stylesheet" href=".../dds-tokens/tokens.css"> <!-- 먼저 -->
<link rel="stylesheet" href=".../dds-css/dds.css">
<button class="dds-btn dds-btn--primary">저장</button>
```

- 모든 값이 시맨틱 토큰 참조(`var(--dds-*)`) — `scripts/check-css.mjs`가
  `src/`의 hex/rgb/hsl/color-mix를 기계적으로 금지하므로, 하드코딩된 색은
  리뷰가 아니라 CI에서 실패합니다.
- 다크 모드는 공짜: `<html>` 또는 임의 서브트리에 `data-theme="dark"`
  (`data-theme="light"`로 되고정). 어떤 컴포넌트에도 다크 분기가 없습니다.
- 개별 임포트: `@devslab-kr/dds-css/components/button.css` 등.
- 컴포넌트별 마크업 계약·상태·접근성 체크리스트·do/don't:
  [`docs/components.ko.md`](../../docs/components.ko.md).
  라이브 레퍼런스: `preview/components.html` (먼저 `pnpm build`).
