---
"@devslab/site-kit": patch
---

The header's actions no longer paint over the navigation (D-036).

The desktop header centres the nav with two equal side columns. Those columns could shrink below their content, so when the actions were wider than half the room beside a long nav they spilled over the last link — VisionLinq's 364px actions covered "API-Dokumentation" in German at 1440px, and French, Portuguese and Spanish too. The side columns now keep their content width (`minmax(max-content, 1fr)`): while both sides fit the nav stays exactly centred as before; when one side needs more, the nav moves toward the other side by the shortfall, and only then wraps. Nothing to change in a product.

헤더의 액션이 더 이상 내비게이션 위에 칠해지지 않는다(D-036).

데스크톱 헤더는 똑같은 양옆 칸 둘로 내비를 가운데 둔다. 그 칸이 내용보다 작게 줄 수 있어서, 긴 내비 옆에 남은 폭의 절반보다 넓은 액션이 마지막 링크 위로 넘쳤다 — VisionLinq의 364px 액션이 1440px 독일어에서 "API-Dokumentation"을 덮었고, 프랑스어·포르투갈어·스페인어도 같았다. 이제 양옆 칸은 자기 내용 폭을 지킨다(`minmax(max-content, 1fr)`): 양쪽이 들어가면 내비는 전처럼 정확히 가운데이고, 한쪽이 더 필요하면 내비가 모자란 만큼만 반대쪽으로 비켜나며, 그다음에야 줄을 바꾼다. 제품이 바꿀 것은 없다.
