# DDS Android 0.6.0 — Product Colors, Buttons, Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a product declare contrast exceptions and its own page backgrounds, fill the secondary button, add an ink text button, and give the menu no shadow, end alignment and a divider — released as DDS Android 0.6.0.

**Architecture:** `DdsBrandColors` grows three optional backgrounds and a set of declared exceptions; `DdsBrand` checks more pairs and skips the declared ones; `DdsBrand.fromResources` reads the backgrounds from the existing `dds_color_bg_*` resources and the exceptions from three new bool resources; `ddsColors()` takes the backgrounds from the brand. Buttons and the menu are small changes to `Button.kt` and `Overlay.kt`.

**Tech Stack:** Kotlin 2.2.20, Jetpack Compose (BOM 2026.01.00), Material3, JUnit4 unit tests, Compose UI device tests.

**Spec:** `docs/superpowers/specs/2026-11-12-dds-android-product-colors-design.ko.md` (decision record D-053). Read it before starting.

## Global Constraints

- Branch `feat/android-brand-exceptions`. Run `git branch --show-current` before every commit. Stage files by name; never `git add -A`; never `git stash`; never push (the controller pushes).
- No AI attribution in commits or docs.
- No hand-written color or size literals in main Kotlin sources (`scripts/check-android-sources.mjs`); unit tests may build colors with `Color(red, green, blue)` floats or `android.graphics.Color.parseColor`-free helpers — check how `BrandTest.kt` does it and do the same.
- Names, verbatim from the spec: `enum class DdsContrastPair { TextOnBrand, TextBrand, TextOnBackground }`; `DdsBrandColors` new trailing parameters `bgDefault`, `bgSubtle`, `bgElevated` (all `Color = Color.Unspecified`) and `allow: Set<DdsContrastPair> = emptySet()`; bool resources `dds_allow_contrast_text_on_brand`, `dds_allow_contrast_text_brand`, `dds_allow_contrast_text_on_background` (default `false`); `DdsButtonVariant.Plain`; `enum class DdsMenuAlign { Start, End }`; `DdsMenu(expanded, onDismissRequest, modifier, align = DdsMenuAlign.Start, content)`; `DdsMenuDivider(modifier)`.
- The default check stays 4.5:1 (`DdsMinTextContrast`). A declared exception has no floor.
- Existing parameter order and defaults of public functions do not change; new parameters go after the existing ones and before a trailing content lambda.
- `explicitApi()`: public + KDoc in plain English.
- Device tests only on `ANDROID_SERIAL=emulator-5590` (AVD `dds_catalog_api36`, port 5590). Never touch other devices. Kill the emulator when done.
- Every new test is seen failing for the stated reason before the code that passes it.
- Before each commit: `./gradlew testDebugUnitTest lintDebug assembleDebug` in `android/`, `pnpm run verify` and `pnpm run verify:source:stage1-2` from the root. Device tests: the whole `:dds-compose:connectedDebugAndroidTest` (40 existing tests stay green, 0 skipped).
- Docs are pairs (`*.md` + `*.ko.md`); Korean in plain words.

## Review Focus

- A product that declares an exception in the light theme only: the dark theme must still be checked. (Task 1)
- A product that changes only one background: the other two must keep the DDS values, and text is checked on all three. (Task 2)
- A brand built in code with `Color.Unspecified` backgrounds must behave exactly as 0.5.0 (same colors, same Material scheme). (Task 2)
- A secondary button on a white page must look as it did (same pixels at rest); pressed still shows the tint. (Task 3)
- An end-aligned menu whose anchor is near the start edge of the window (no room to the left) must still open inside the window. (Task 4)

---

### Task 1: Declared contrast exceptions

**Files:**
- Modify: `android/dds-compose/src/main/kotlin/kr/devslab/dds/compose/theme/DdsBrand.kt`
- Create: `android/dds-compose/src/main/res/values/dds_brand_rules.xml`
- Test: `android/dds-compose/src/test/kotlin/kr/devslab/dds/compose/theme/BrandTest.kt`, `android/dds-compose/src/androidTest/kotlin/kr/devslab/dds/compose/BrandResourcesTest.kt` (new), test-only resources under `android/dds-compose/src/androidTest/res/`

**Interfaces:**
- Produces: `public enum class DdsContrastPair { TextOnBrand, TextBrand, TextOnBackground }`; `DdsBrandColors(..., allow: Set<DdsContrastPair> = emptySet())` (the three background parameters come in Task 2 — add `allow` as the last parameter now and insert the backgrounds before it in Task 2); `DdsBrand` skips a pair's check in a theme whose colors declare it; the rejection message ends with how to declare it, naming the bool resource and the `allow` argument; `DdsBrand.fromResources` reads the three bools per theme (night configuration for the dark half, the same way colors are read).

- [ ] **Step 1:** In `BrandTest` add: `whiteOnOrangeIsRejectedWithoutAnException` (bgBrand orange 1f/0.416f/0.122f, textOnBrand white → `IllegalArgumentException`); `aDeclaredExceptionLetsThatPairThrough` (`allow = setOf(TextOnBrand)` → no throw); `anExceptionCoversOnlyItsPair` (`allow = setOf(TextOnBrand)` with a `textBrand` that fails on the page → still throws, message names textBrand); `anExceptionInOneThemeDoesNotCoverTheOther` (light declares, dark does not → throws naming "dark"); `theRejectionSaysHowToDeclareIt` (message contains `dds_allow_contrast_text_on_brand` and `DdsContrastPair.TextOnBrand`); `theDefaultBrandNeedsNoException`.
- [ ] **Step 2:** Run `./gradlew :dds-compose:testDebugUnitTest --tests "*BrandTest"`; expect compile failure, then assertion failures.
- [ ] **Step 3:** Implement: the enum, the `allow` parameter, pair-aware `requireBrandContrast`, the message, `dds_brand_rules.xml` with the three bools `false`, and reading them in `readBrand`.
- [ ] **Step 4:** Device test `BrandResourcesTest`: with androidTest resources that redefine `dds_color_bg_brand` (orange), `dds_color_text_on_brand` (white) and set `dds_allow_contrast_text_on_brand` true in `values` only, `DdsBrand.fromResources(context)` — decide and document which behaviour the night half gets when `values-night` does not repeat the bool (Android falls back to `values`, so the declaration applies to both unless `values-night` sets it `false`); assert that fallback, and assert that with `values-night` setting it `false` and a failing dark pair the brand is rejected. See it fail first by removing the bool.
- [ ] **Step 5:** Pre-commit set, device suite, commit: `feat(android): a product can declare a contrast exception, pair by pair`.

### Task 2: Product backgrounds

**Files:**
- Modify: `.../theme/DdsBrand.kt`, `.../theme/DdsColors.kt` (`ddsColors`), `.../theme/DdsTheme.kt` only if needed
- Test: `BrandTest.kt`, `.../theme/ColorSchemeTest.kt`, `BrandResourcesTest.kt`

**Interfaces:**
- Consumes: Task 1's `DdsContrastPair`, `allow`.
- Produces: `DdsBrandColors(bgBrand, bgBrandHover, bgBrandSubtle, textBrand, textOnBrand, borderFocus, bgDefault = Color.Unspecified, bgSubtle = Color.Unspecified, bgElevated = Color.Unspecified, allow = emptySet())`; `ddsColors(dark, brand)` uses the brand's background where specified, else the token; `readBrand` reads `dds_color_bg_default`, `dds_color_bg_subtle`, `dds_color_bg_elevated`; `DdsBrand` checks `TextBrand` on page, subtle, elevated and `bgBrandSubtle`, and `TextOnBackground` (`textPrimary`, `textSecondary` of that theme's tokens) on the three resolved backgrounds.

- [ ] **Step 1:** Unit tests: `anUnspecifiedBackgroundIsTheSystems` (colors equal 0.5.0's for the default brand — compare `ddsColors` output field by field with the token values); `aProductBackgroundReplacesOnlyThatOne`; `theMaterialSchemeFollowsTheProductBackground` (`background`, `surface` and the roles that mapped to `bgDefault`/`bgElevated`); `darkTextOnADarkProductPageIsRejected` (bgDefault near black in the light theme → throws naming textPrimary on the page); `declaringTextOnBackgroundLetsItThrough`; `brandTextIsCheckedOnAllThreeBackgrounds`.
- [ ] **Step 2:** Run; expect failures.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Extend `BrandResourcesTest`: androidTest resources redefine `dds_color_bg_default` (a warm paper color) → `DdsTheme.colors.bgDefault` and `MaterialTheme.colorScheme.background` are that color; a `DdsTopBar` and a `DdsBottomBar` drawn under that theme have that color at a background pixel.
- [ ] **Step 5:** Pre-commit set, device suite, commit: `feat(android): a product can set the page, subtle and card backgrounds`.

### Task 3: Buttons

**Files:**
- Modify: `.../component/Button.kt`
- Test: `android/dds-compose/src/androidTest/kotlin/kr/devslab/dds/compose/ButtonOnDeviceTest.kt` (new), `ScreenReaderTest.kt` (a `Plain` button is a button with its label)

**Interfaces:**
- Produces: `DdsButtonVariant.Plain` (transparent, `textPrimary`, pressed tint, base font weight); `Secondary` container = `bgElevated` at rest and `overlayPressedTint` composited over `bgElevated` when pressed; border and text unchanged.

- [ ] **Step 1:** Device tests on a page painted `Color.Green`: `aSecondaryButtonIsFilledWithTheCardBackground` (a pixel inside the button, away from the label, equals `DdsTheme.colors.bgElevated`, not green); `aPlainButtonShowsThePageAndInkText` (inside pixel is green; label color is `textPrimary` — read through the text layout's color or a pixel of a wide glyph); `aGhostButtonIsUnchanged` (inside pixel green, label `textBrand`); `aPressedSecondaryButtonIsTinted` (clock held, press, the inside pixel moves toward the tint over 100ms and is not the rest color at the end).
- [ ] **Step 2:** Run; expect the first two to fail (green shows through; no `Plain`).
- [ ] **Step 3:** Implement. `when` over variants must stay exhaustive without `else` where it reads better.
- [ ] **Step 4:** Pre-commit set, device suite, commit: `feat(android): the secondary button is a filled face; a plain ink text button`.

### Task 4: Menu

**Files:**
- Modify: `.../component/Overlay.kt`
- Test: `android/dds-compose/src/androidTest/kotlin/kr/devslab/dds/compose/MenuOnDeviceTest.kt` (new), `ScreenReaderTest.kt`

**Interfaces:**
- Produces: `public enum class DdsMenuAlign { Start, End }`; `DdsMenu(expanded, onDismissRequest, modifier = Modifier, align = DdsMenuAlign.Start, content)`; `DdsMenuDivider(modifier = Modifier)` (1dp `borderDefault`, `DdsSpace.s4` above and below, not a semantics node of its own); `shadowElevation = 0.dp`.

- [ ] **Step 1:** Device tests (a 48dp anchor button in the middle of a 400dp-wide row, menu items tagged): `byDefaultTheMenuStartsWhereItsButtonStarts`; `anEndAlignedMenuEndsWhereItsButtonEnds` (menu right = button right within 1dp); the same two in right-to-left (mirrored); `anEndAlignedMenuNearTheStartEdgeStaysInsideTheWindow` (anchor at x = 0: the whole menu is inside the window); `theMenuCastsNoShadow` (capture the screen; the pixels 2dp outside each edge of the menu equal the page color exactly); `theDividerIsNotReadAsAnItem` in `ScreenReaderTest`.
- [ ] **Step 2:** Run; expect the end-alignment and shadow tests to fail.
- [ ] **Step 3:** Implement. For `End`, first try the smallest change: provide the opposite `LocalLayoutDirection` around Material's `DropdownMenu` (its position provider then prefers aligning the far edges) and restore the real direction around `content`; if the tests show Material does not behave that way in this version, measure the anchor and the menu and pass `offset`, hiding the first frame, and say which route was taken in the report.
- [ ] **Step 4:** Pre-commit set, device suite, commit: `feat(android): the menu has no shadow, can align to the end of its button, and has a divider`.

### Task 5: Catalog, a look at it, documents, version

**Files:**
- Modify: `android/catalog/src/main/kotlin/kr/devslab/dds/catalog/Pages.kt` (a "Product colors" section on the Colors or Parts page: an orange brand with white text built in code with `allow = setOf(TextOnBrand)` and a warm paper page, a card, primary / secondary / plain / ghost buttons, an end-aligned menu with a divider — wrapped in its own `DdsTheme(brand = …)`), `CLAUDE.md` (the absolute rules, per spec §5), `docs/design-system.md` + `.ko.md`, `docs/decisions.md` (D-053), `docs/mobile-native.md` + `.ko.md`, `android/CHANGELOG.md` + `.ko.md` (0.6.0), `android/README.md` + `.ko.md`, `README.md` + `README.ko.md` (version line), `docs/backlog.md`, `android/gradle.properties` (`VERSION_NAME=0.6.0`)

- [ ] **Step 1:** Catalog section. Install on `emulator-5590`, capture it in light and dark, at normal and large text; look: button rows of even height, the menu's end on the button's end, no clipped text, the paper page under the white card. Fix what the captures show (test first).
- [ ] **Step 2:** Documents, written from what was built: the rule change (default 4.5:1, declared exceptions, no floor; six brand colors plus three backgrounds), how to declare in resources and in code, what is checked on a changed background, what is not (control edges 3:1 are the product's to check), the button and menu changes under "If you move up", and what was not checked (a physical phone).
- [ ] **Step 3:** Full verification (unit, lint, assemble, whole device suite with the XML read, `pnpm run verify`, stage1-2, `publishToMavenLocal`). Commit: `docs: a product declares contrast exceptions and its backgrounds (D-053); Android 0.6.0`.
