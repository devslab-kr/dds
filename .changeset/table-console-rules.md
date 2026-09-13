---
"@devslab/dds-css": patch
---

The table carries the four console rules its first consumer still kept for itself.

A `<code>` inside a `.dds-table` cell takes the mono family at 13px. Row actions (`.dds-table__actions .dds-btn`) are 32px whatever their size modifier and never wrap, and the actions cell trims its block padding, so a row with a button is as tall as a row without one; any cell holding a `.dds-btn--sm` (a copy button beside an id) trims its padding the same way. In `.dds-table--dense`, row actions and every `.dds-btn--sm` are 24px. On a coarse pointer every one of those buttons returns to the 44px touch floor — the row grows rather than the target shrinking. `.dds-table-wrap--tall` switches its table to separate borders, since collapsed borders can keep the sticky header from sticking.

테이블이 첫 소비자가 아직 자기 쪽에 들고 있던 콘솔 규칙 네 가지를 갖는다.

`.dds-table` 셀 안의 `<code>`는 13px 모노 서체를 쓴다. 행 액션(`.dds-table__actions .dds-btn`)은 크기 수식자와 상관없이 32px이고 줄바꿈하지 않으며, 액션 셀은 세로 패딩을 줄여 버튼이 있는 행이 없는 행과 높이가 같다. `.dds-btn--sm`(id 옆 복사 버튼)을 담은 셀도 같은 방식으로 패딩을 줄인다. `.dds-table--dense`에서는 행 액션과 모든 `.dds-btn--sm`이 24px이다. 거친 포인터(터치)에서는 이 버튼들이 전부 44px 터치 하한으로 돌아간다 — 타깃이 줄어드는 대신 행이 커진다. `.dds-table-wrap--tall`은 테이블을 분리 테두리로 바꾼다. 테두리를 합치면 sticky 헤더가 붙지 않을 수 있기 때문이다.
