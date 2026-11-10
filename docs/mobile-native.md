# DDS Native Mobile Guide — Android

🌐 [한국어](mobile-native.ko.md)

How a native Android app (Kotlin · Jetpack Compose · Material3) uses the **same
values and the same rules** as the web. The values are generated from
`tokens/*.json` and the app takes them as a dependency. Nobody copies a value
by hand.

The guide holds two kinds of content.

- **Web DDS rules carried over** — color, type, spacing, radius, status colors,
  the brand override. Each item names its source as `[spec §3.1]`; the source is
  [`design-system.md`](design-system.md). No new rule was made for mobile.
- **What mobile taught us** — §2, motion and detail. It was learned by actually
  building JeongsanNow and Qooroo, and it is the centre of this guide. Each item
  comes as a rule, reusable code and a way to check it.

What the web rules do not cover, and still has to be decided, is collected in
§10. Decision record: [`decisions.md`](decisions.md) D-048. iOS is not covered yet.

| Coordinate | Contents |
| --- | --- |
| `kr.devslab:dds-android-tokens` | Values only: Kotlin constants and XML resources. No Compose needed |
| `kr.devslab:dds-compose` | Theme, brand, motion and loading helpers. Brings the coordinate above |

Minimum Android 8 (API 26). Usage and versioning: [`android/README.md`](../android/README.md).

---

## 1. Principles

1. **Values come only from tokens.** No hex, no `Color(0x…)`, no height or duration number in app code. `[spec §1]`
2. **Read colors from `DdsTheme.colors`.** Semantic tokens only. `[spec §3.1]`
3. **Dark is another mapping of the same tokens.** Components never branch on the theme. `[spec §3.1]`
4. **The only thing an app passes in is its brand color (six tokens).** Everything else is shared by the family. `[spec §3.1, D-012]`
5. **Movement is used only to say what changed.** `[JeongsanNow motion spec]`

## 2. Motion and detail

Sources: JeongsanNow `docs/jn-android-motion-2026-11-10.md` and its implementation
(commit `8f56362`); Qooroo `docs/design/android/DESIGN.md` §5, §7, §9. Of the
durations and easings, 100, 200, 300ms and `standard`, `exit` are the web token
values `[spec §3.6]`.

### 2.1 One place for every value

| Name | Value | Use |
| --- | --- | --- |
| `DdsMotion.Fast` | 100ms | leaving, press feedback, a screen's opacity on arrival |
| `DdsMotion.Short` | 150ms | switching tabs, list items appearing, progress |
| `DdsMotion.Base` | 200ms | going back, expand and collapse, dialogs |
| `DdsMotion.Slow` | 300ms | a new screen, sheets, the logo travelling |
| `DdsMotion.Standard` | (0.2, 0, 0, 1) | arriving, changes inside a screen |
| `DdsMotion.Exit` | (0.3, 0, 1, 1) | leaving |
| `DdsMotion.Travel` | (0.4, 0, 0.2, 1) | something that was standing still starting to move |
| `DdsMotion.Shift` | 24dp | how far a screen's content slides in |
| `DdsMotion.StaggerStep` / `StaggerLimit` | 30ms / 6 | the list stagger and its cap |

- These four durations are all there are. No number in screen code.
- **Nothing overshoots or springs. Pressing never changes size or position.** Press feedback is the ripple.
- Haptic feedback stays on under reduced motion (Qooroo).

### 2.2 Splash

The goal is a logo that runs unbroken from the splash to the first screen. The
logo's shape and color are the app's; the system supplies the way to join them.

**Rules for drawing the splash drawable** (reference: `android/catalog/src/main/res/drawable-v31/splash_mark.xml`)

1. **The drawable at rest is the finished logo.** The animation starts from
   nothing and ends finished. A device with animations off, and the window
   background, show this resting state.
2. **The start delay is not `startOffset` but a "same value" segment.** Play first
   an animator whose from and to are both the empty state. The very first frame is
   then already empty, and the finished logo never flashes before the drawing begins.
3. **Start drawing after about 250ms**, so the drawing does not run while the
   device is still opening the window. Draw with a curve that does not rush its
   first half (`fast_out_slow_in`, (0.4, 0, 0.2, 1)). The in-screen curve
   (0.2, 0, 0, 1) is most of the way there in its first half, and the sense of
   something being drawn is lost.
4. **Keep the logo whole inside the middle third (96dp) of the 288dp canvas.** A round mask then never cuts it.
5. **Always define a splash theme and a drawable of its own.** Without them the launcher icon appears, cut to a circle (Qooroo hit this).
6. Android 11 and below show a still drawable (still in `drawable/`, animated in `drawable-v31/`).
7. The color is `@color/dds_color_bg_brand`, the background `@color/dds_color_bg_default`.
   Night variants and a brand override come along.

**Rules for handing over to the first screen** (code: `DdsSplashHandoff`, `DdsSplashOverlay`, `Modifier.ddsSplashTarget`)

8. **The first screen draws the logo again at the same place, size and color,
   swaps in one frame, then moves that logo.** A large logo is drawn from a path,
   not an image (it is scaled while it travels).
9. **Keep the system splash itself until the drawing is over**
   (`setKeepOnScreenCondition`). The copy the system hands over can show the
   animated icon missing for a frame or two, so in the exit listener `remove()` it at once.
10. **Put the same logo in the window background too.** A frame between the system
    splash and the first composition then still shows it. Return to the plain color when the handoff is done.
11. **Time the hold from the first ready frame, and never beyond one second.**
    Timed from process start, a slow launch is made slower.
12. **The move takes 300ms with the `Travel` easing.** A logo that was standing
    still, set off with a front-loaded curve, looks like a jump whenever a frame is dropped.
13. **A screen registers the destination, and the highest priority wins.** Each
    registration records who made it, so a previous screen that is disposed late
    cannot erase the new screen's registration (a bug JeongsanNow actually hit; pinned by a test).
14. **With no destination** (a lock screen) the splash lifts in 150ms without a move,
    and the logo at the destination shows through the lifting cover.
15. **A recreated Activity does not replay it** (`active = savedInstanceState == null`).
    The cover lifts on its own after a safety interval.
16. While the first screen is not known yet (the session is still being read),
    `keepOnScreen(now, firstScreenKnown = false)` waits within the same limit, so the logo has somewhere to go (Qooroo).
17. **Removing the splash re-applies the theme, which resets the status bar icon
    color to the theme's.** Set `android:windowLightStatusBar` to `@bool/dds_light_system_bars`.

```kotlin
val handoff = DdsSplashHandoff(
    active = savedInstanceState == null,
    reduced = isReducedMotion(this),
    createdAt = SystemClock.uptimeMillis(),
    drawMs = 800,                               // how long the splash drawable draws
)
installSplashScreen().apply {
    setKeepOnScreenCondition { handoff.keepOnScreen(SystemClock.uptimeMillis()) }
    setOnExitAnimationListener { it.remove(); handoff.release() }
}
setContent {
    LaunchedEffect(handoff.phase) {             // rule 10: plain window background once done
        if (handoff.phase == DdsSplashHandoff.Phase.Done) window.setBackgroundDrawableResource(R.color.dds_color_bg_default)
    }
    DdsTheme {
        CompositionLocalProvider(LocalDdsSplashHandoff provides handoff) {
            Box(Modifier.fillMaxSize()) {
                App()                           // Modifier.ddsSplashTarget(priority) on the logo
                DdsSplashOverlay(handoff, background = DdsTheme.colors.bgDefault, markSize = 96.dp) { size -> AppMark(size) }
            }
        }
    }
}
```

**Known limit — empty frames are not zero.** Measured by JeongsanNow after moving to
0.1.0, on a dedicated emulator (Android 16, recorded at 30fps, logo pixels counted per
frame). Not measured on a physical device.

| Approach | Frames without the logo |
| --- | --- |
| `remove()` + `release()` at once in the exit listener (rule 9) | 2 runs in 5, one frame each: system logo → empty frame → the logo the app drew |
| No listener, letting the system lift the splash itself | 2 to 5 frames in 4 runs of 9; in the rest the logo faded and came back. Not used |

The likely cause is the hand-over copy showing one frame without its icon before the
listener runs. The copy is opaque, so the logo in the window background (rule 10) did not
cover it. Rule 9 is the better of the two but does not guarantee zero empty frames. The
alternative is a splash with the background only, the app's overlay doing the drawing
itself — there is no logo to hand over, so none can go missing; the logo then appears
after the first frame. Not built: the physical-device result below did not call for it.

Where the two apps differed, and what was chosen:

| Item | JeongsanNow | Qooroo | Chosen | Why |
| --- | --- | --- | --- | --- |
| Hold limit | 1s from the first frame | 2s from the first frame | 1s (default, adjustable) | never make a slow launch slower |
| What it waits for | the drawing to end | the first screen to be decided | the drawing + `firstScreenKnown` | both are needed; one limit |
| Overshoot on the last piece | none | the square pops slightly past and back | not in the system | no overshoot. The splash drawable is the app's, so Qooroo may keep it inside its drawable |
| Priority | highest wins | — | highest wins | as JeongsanNow |

**Measured on a physical device (0.2.0).** Galaxy Z Fold (SM-F971N, Android 17, unfolded,
dark, font scale 1.3), the catalog app, six cold starts recorded with `screenrecord` (about
18 frames a second) and every frame read on a contact sheet: the logo is on screen in every
frame from the moment it is drawn until it lands — zero frames without it. This is rule 9
as written above. The emulator result in the table stands for the emulator only.

JeongsanNow measured its own app on the same device (unfolded, dark, animation scale 1;
a separate review package, removed afterwards): six `screenrecord` runs at 60 frames a
second, counting logo-colored pixels in the middle of the screen per frame. All six ran
the same way and no frame was without the logo at the hand-over. The one empty frame seen
in 2 of 5 emulator runs did not appear. From the window opening to the first screen fully
shown took about 1.35s (the two letters about 0.15s and 0.17s, the hold about 0.45s, then
the move). Not measured: light, animations off, folded, arriving after sign-in.

When counting only the middle of the screen, the count drops to zero as the logo moves out
of that area. Count a zero as an empty frame only inside the hold.

**A splash with no icon.** Android draws a plain splash, with no icon, when the app is
opened from somewhere other than the launcher (another app, a notification, `adb` without
`--splashscreen-show-icon` on some versions). A mark that was never on screen must not
appear from nowhere and fly, so ask the splash view and pass the answer on:

```kotlin
setOnExitAnimationListener { provider ->
    val shown = splashShowedMark(provider.view)
    provider.remove()
    handoff.release(markShown = shown)   // false: the cover simply lifts
}
```

Checked by a unit test only: the test device showed the icon on every launch path tried.

### 2.3 Screen transitions

Code: `DdsScreenMotion(move)`, `Modifier.ddsScreenContent()`, `DdsMove`.

18. **Only the content moves.** The top bar, the title and the bottom tabs neither move nor fade.
19. **Remove the previous screen at once.** A whole screen fading in over the gap
    it left reads as a flicker (fixed in JeongsanNow on 2026-11-08; Qooroo's whole-screen
    fade of 200/150 is that same approach, and moves to this one).
20. **Finish the opacity within 100ms.** A screen still faint while it slides looks empty.
21. **When the account or workspace changes, switch at once with no movement** (`DdsMove.None`).
22. A rotated or restored screen does not arrive a second time.

| Move | Appear | Slide |
| --- | --- | --- |
| Forward (`Push`) | 100ms | 24dp from the trailing edge, 300ms |
| Back (`Pop`) | 100ms | 24dp from the leading edge, 200ms |
| Tab (`Tab`) | 150ms | none |
| None (`None`) | at once | — |

```kotlin
// Give the navigation host no transition of its own (None).
key(entry) {
    DdsScreenMotion(move) {                       // how the person got here
        Scaffold(topBar = { … }, bottomBar = { … }) { padding ->
            Column(Modifier.padding(padding).ddsScreenContent()) { … }   // the part that moves
        }
    }
}
```

### 2.4 Lists and small movements

23. **List items appear 30ms apart, for the first six only** (180ms at most), so a
    long list never trickles. They appear; they do not move or grow.
    `Modifier.ddsAppear(index)`. An item scrolled away and back does not appear again.
24. A notice whose content changed appears again with `Modifier.ddsAppear(key = message)`.
25. Expand takes 200ms `Standard`; collapse 200ms `Exit` with a 100ms fade.

### 2.5 Loading and refreshing

Code: `DdsBusyBar`, `DdsLoadingRows`, `DdsPullRefresh`.

26. **The progress bar is drawn over the content.** Work starting and ending never
    pushes the content down. It appears in 150ms and leaves in 100ms.
27. **A first load shows still placeholders**, so "nothing here" never shows for a moment before the answer.
28. **Pull to refresh does what the screen's refresh button does.** Keep the button.
    The indicator stays until the real work ends, never for a fixed time. A pull is
    ignored while other work runs or a menu is open.
29. **While a pull is loading, do not show the progress bar as well** (`onPulling`).

```kotlin
DdsPullRefresh(busy = state.busy, onRefresh = { refresh() }, onPulling = { pulling = it }) {
    Column(Modifier.verticalScroll(…)) {
        if (state.firstLoad) DdsLoadingRows(description = "Loading") else List(state.items)
    }
    DdsBusyBar(busy = state.busy && !pulling)
}
```

### 2.6 Logo, icon, window

30. Inside the app the logo is drawn without a backing square, in `bg.brand`.
31. The launcher icon is adaptive, with a monochrome layer.
32. The window background color equals the app background (`@color/dds_color_bg_default`).

### 2.7 Reduced motion

`isReducedMotion(context)` / `rememberReducedMotion()` — the system's "Remove
animations" (animator scale 0). `[spec §3.6]`

- Compose then finishes its own animations at once. The helpers also skip the
  screen slide and the list stagger, do not hold the splash, and do not move the logo.
- The splash is the finished logo, still, then straight to the first screen.
- State is never carried by movement alone; text and an icon carry it too.

### 2.8 How to check

Movement cannot be verified by reading code. Look at these directly.

1. **Watch a cold start three ways: light, dark, and "Remove animations".** Look
   for a frame without the logo, and compare where the splash draws the logo with
   where the first screen draws it again.
2. **Slow it down.** `adb shell settings put global animator_duration_scale 10`
   stretches the move tenfold, and screenshots taken in a row catch it mid-flight (set it back to 1 afterwards).
3. **Stop the clock and step the frames.** In a Compose test set
   `mainClock.autoAdvance = false`, advance 50ms at a time and save each frame;
   the result repeats exactly (JeongsanNow `JnMotionTest`). With the clock stopped,
   the action after a tab switch can hang, so that test runs in real time.
4. Record an emulator with `adb emu screenrecord`. Under heavy load do not judge
   smoothness — only the order and position of frames.
5. **Name the device on every command** (`adb -s emulator-55xx`; `ANDROID_SERIAL`
   for tests). Unnamed, it installs on a connected real phone (Qooroo hit this).
6. Screen transitions: check that the top bar and bottom tabs do not move by a pixel between frames.
7. Check for clipping at a 200% font scale and in large text mode.

The Motion screen of the `android/catalog` app has every behavior in this section.

## 3. Color

### 3.1 Overriding the brand color `[spec §3.1, D-010, D-012]`

The convention is the web's. **An app may replace the six tokens of the brand
slice and nothing else**; names and count match the web. Pass nothing and you get the DDS default.

| Token | Android resource | What the product decides |
| --- | --- | --- |
| `color.bg.brand` | `dds_color_bg_brand` | the main color: the filled brand face |
| `color.bg.brand-hover` | `dds_color_bg_brand_hover` | that face while pressed |
| `color.bg.brand-subtle` | `dds_color_bg_brand_subtle` | pale brand background |
| `color.text.on-brand` | `dds_color_text_on_brand` | text on that face |
| `color.text.brand` | `dds_color_text_brand` | brand text, links, selected icons |
| `color.border.focus` | `dds_color_border_focus` | focus ring |

**How to override.** Where the web redefines CSS variables under `[data-brand]`, an
app redefines the color resources of the same names in its own `res/values`
(`res/values-night` for dark). Android prefers the app's resources over a library's.

```xml
<!-- JeongsanNow app/src/main/res/values/dds_brand.xml — the main color is the JN logo color -->
<resources>
    <color name="dds_color_bg_brand">#0891B2</color>
</resources>
```

From that one place the splash (XML), the window background, the logo and Compose
(`DdsTheme` reads these resources by default) change together: buttons, selection,
emphasis and the logo all follow. This file is the one place in an app where hex
may be written (the counterpart of the web's `brand.ts`).

A token that is the same in light and dark (`bg_brand`, `bg_brand_hover`,
`text_on_brand`) needs one definition in `res/values` and applies to both. A token
with a dark value of its own (`bg_brand_subtle`, `text_brand`, `border_focus`) must
also be redefined in `res/values-night`; otherwise the DDS default stays there.

A brand can also be passed in code (`DdsTheme(brand = DdsBrand(light = …, dark = …))`).
XML resources are then unchanged, so the splash keeps the default color. Prefer resources.

**The rule decides the text color.** `[spec §3.1, on-brand note]` Text on a filled
brand face must exceed 4.5:1. A bright face takes dark text, a dark face white.

- On `#0891B2`: white is 3.7:1 (fails), `zinc.950` 5.7:1 (passes). The default is
  `zinc.950`, so JeongsanNow need not write `on-brand` at all.
- An app with a dark main color redefines `dds_color_text_on_brand` as white. In
  code, `onBrandFor(bgBrand)` picks by the rule.
- **`DdsTheme` rejects a brand that breaks the rule.** If any of three pairs is
  below 4.5:1 it throws, with the measured ratio in the message: text on the face,
  brand text on the page background, brand text on the pale brand background.

How the other five values follow from a main color is not a rule on the web either
(the product picks them). See §10, item 1.

**What may be replaced, and what is fixed.**

| May be replaced | Fixed for the family |
| --- | --- |
| the six tokens of the brand slice | neutral backgrounds, text and lines; the four status pairs; the type scale; spacing; radii; control heights; motion values; touch size |

### 3.2 Using color `[spec §3.1]`

- Page background `bg.default`, group background `bg.subtle`, cards, sheets and dialogs `bg.elevated`.
- Text `text.primary` / `text.secondary` / `text.muted` (disabled, placeholders).
- Lines `border.default` (card edges, dividers), `border.strong` (text fields).
- **The primary button is a `bg.brand` face with `text.on-brand` text — the same color in light and dark.**
- Brand text, links and selection use `text.brand`; a pale emphasis background is `bg.brand-subtle`.
- Press and hover tints are alpha only. `opacity` is for disabled only.
- The four status pairs are used only as a strong foreground on its pale background. State is not carried by color alone. `[spec §6]`

### 3.3 Mapping onto Material3 roles (mobile only)

Material3's `primary` is both a fill and a text color, where DDS has `bg.brand` and
`text.brand`. So `primary` takes the text color, and a filled face uses
`DdsTheme.colors.bgBrand` directly.

| Material3 role | DDS token | Light | Dark |
| --- | --- | --- | --- |
| `primary` / `onPrimary` | `text.brand` / picked by contrast | cyan.700 / white | cyan.400 / zinc.950 |
| `primaryContainer`, `secondaryContainer` | `bg.brand-subtle` | cyan.50 | cyan.900 |
| `inversePrimary` | the other theme's `text.brand` | cyan.400 | cyan.700 |
| `background`, `surface` | `bg.default` | white | zinc.950 |
| `surfaceContainer`, `-Low`, `-High` | `bg.elevated` | white | zinc.900 |
| `surfaceDim`, `surfaceContainerHighest` | `bg.subtle` | zinc.50 | zinc.900 |
| `surfaceVariant` | `border.default` | zinc.200 | zinc.800 |
| `onSurface`, `onBackground` | `text.primary` | zinc.950 | zinc.50 |
| `onSurfaceVariant`, `secondary` | `text.secondary` | zinc.600 | zinc.400 |
| `outline` / `outlineVariant` | `border.strong` / `border.default` | zinc.300 / zinc.200 | zinc.700 / zinc.800 |
| `error` / `onError` | `status.danger` / `text.on-status` | red.700 / white | red.300 / zinc.950 |
| `errorContainer` / `onErrorContainer` | `status.danger-bg` / `status.danger` | red.50 / red.700 | red.900 / red.300 |
| `inverseSurface` / `inverseOnSurface` | `bg.inverse` / `text.on-inverse` | zinc.900 / zinc.50 | zinc.50 / zinc.950 |
| `scrim` | `overlay.dim` | black 25% | black 25% |
| `surfaceTint` | transparent | — | — |

- Why `surfaceVariant` is not `bg.subtle`: in dark, `bg.subtle` and `bg.elevated`
  are the same color, and Material finds the text color of a `Surface` by its
  background. With the two equal, card text drops to the secondary color (pinned by a test).
- `secondaryContainer` is the pale brand background because Material uses it for
  **selection** (the bottom tab pill, a selected chip). Material also uses the role
  for progress and slider tracks, where it is too faint on a light page. Pass
  `trackColor = DdsTheme.colors.borderDefault` for a track (`DdsBusyBar` does).

> All four status pairs clear 4.5:1 in both themes since D-049 (Android 0.2.1): the dark
> danger and info text moved one step lighter. A test holds the line.

## 4. Type `[spec §3.2]`

| Style | Size/line (sp) | Weight | Use | Material3 slots |
| --- | --- | --- | --- | --- |
| `display` | 32 / 40 | 700 | large numbers | display*, headlineLarge |
| `title1` | 24 / 32 | 700 | screen title | headlineMedium |
| `title2` | 20 / 28 | 600 | section and dialog title, top bar | headlineSmall, titleLarge |
| `title3` | 17 / 24 | 600 | card title | titleMedium |
| `body1` | 16 / 24 | 400 | body | bodyLarge |
| `body2` | 14 / 20 | 400 | dense body | bodyMedium |
| `label` | 13 / 16 | 500 | buttons, field labels, tabs | titleSmall, labelLarge |
| `caption` | 12 / 16 | 400 | timestamps, secondary detail | bodySmall, labelMedium, labelSmall |

- No size outside this table. Size and line height are a set. Body is 14 or more; `caption` is never body text.
- Where numbers matter, turn on tabular figures (`fontFeatureSettings = "tnum"`).
- Korean breaks only at spaces (`"…".keepWords()`) — the result of the web's `keep-all`.
- Units are sp (the same numbers as the web's px and RN's pt), so the system font scale applies.
- Mobile only: one typeface, Pretendard (§9); the Material3 slot mapping; large text mode (§10, item 7).

## 5. Spacing, radius, heights

| Value | Token | dp | Source |
| --- | --- | --- | --- |
| Spacing | `DdsSpace.s4 … s64` | 0 2 4 8 12 16 20 24 32 40 48 64 | `[spec §3.3]` |
| Radius | `DdsRadius.sm / md / lg / xl` | 4 / 8 / 12 / 16 — tag / button, field / card, dialog / sheet | `[spec §3.4]` |
| Stroke | `DdsBorder.hairline / focus` | 1 / 2 | `[spec §6]` |
| Button | `DdsControl.sm / md / lg` | 40 / **48** / 56 | §10, item 2 |
| Text field | `DdsField.height` | 56 | §10, item 2 |
| List row | `DdsRow.min / twoLine` | 56 / 72 | §10, item 2 |
| Top bar / bottom tabs | `DdsBar.top / bottom` | 64 / 80 | §10, item 2 |
| Screen gutter / between blocks | `DdsScreen.gutter / gutterWide / blockGap` | 16 / 24 (width 600+) / 24 | §10, item 2 |
| Minimum touch | `DdsTouch.min / large` | 48 / 56 | §9 |

- **There is one button height, 48.** `lg` (56) is for the single primary button at the bottom of a screen.
- Every height is a **minimum**: a larger font makes a taller control.
- Buttons on one row are the same height. When they no longer fit on a row, stack them instead of shrinking them.
- A card is a `bg.elevated` face + a 1dp `border.default` edge + radius 12 `[components, Card]`. For the shadow see §9.

## 6. Icons `[spec §3.7]`

24 grid, 1.6 stroke, round caps, colored by the surrounding text. An icon-only
button must have a description `[spec §6]`.

The Compose vectors are **generated** from the `dds-icons` SVGs
(`node scripts/generate-android-icons.mjs`, drift-checked by `pnpm run check`), so
the two platforms draw the same shapes: `DdsIcons.Search`, `DdsIcons.ArrowLeft`
(mirrored in right-to-left layouts), … Draw one with `DdsIcon(icon, contentDescription)`;
the size is `DdsIcon.md` (24) or `sm` (20) and the tint is the surrounding content color.

## 7. System bars (mobile only)

Draw edge to edge (`enableEdgeToEdge`). The status and navigation bars are
transparent, and their icons follow the theme **actually shown**. Use
`@bool/dds_light_system_bars` in the theme.

## 8. Accessibility `[spec §6]`

- Text contrast 4.5:1; large text and UI elements 3:1.
- Touch targets 48dp or more (§9).
- An icon-only button must have a description.
- State is not carried by color alone. A selected tab changes its pill, its color and its weight together.
- Respect reduced motion (§2.7).
- Focus is a 2dp `border.focus` ring.
- Nothing clips at a 200% system font scale. Where one line is fixed (bottom tab labels) use an ellipsis.

## 9. What has to differ on mobile

| Item | Web | Android | Why |
| --- | --- | --- | --- |
| Touch target | 44 (mobile) | 48 | Android's accessibility line and Material3's default. It clears 44 |
| Hover | yes | none; `brand-hover` is the pressed color | touch screens |
| Press feedback | color change | ripple | platform convention |
| Typeface | Latin Geist + Korean Pretendard | Pretendard | Compose picks a font by weight; two families at one weight means only the first is used |
| Rare Korean syllables | all Pretendard | syllables outside KS X 1001 use the system font | the font files are cut to about 0.5 MB per weight |
| Color roles | CSS variables | the Material3 role mapping (§3.3) | Material components read color by role |
| Brand override | `[data-brand]` CSS | color resources of the same names | the platform's override mechanism differs; the six tokens and their names do not |
| System bars | — | transparent, edge to edge | platform convention |
| Back | browser | system back | platform convention |
| Modal | Dialog | bottom sheet for choices and actions, Dialog to confirm | `[spec §5]` role mapping |
| Focus ring | keyboard `focus-visible` | keyboard and D-pad focus | touch has no focus |
| Version | all web packages share one | Android has its own | D-048 |

## 10. What the web DDS rules do not cover

The web spec has no rule for the items below. The Android packages ship them with "the value put
in for now"; making them DDS rules is the owner's call. Once decided,
`tokens/native.json` or the spec is updated.

| # | Missing rule | Value put in for now | Basis |
| --- | --- | --- | --- |
| 1 | How the other five (pressed, pale background, brand text, focus, the dark values) follow from one main color | none — as on the web, the product decides. A value not written stays the DDS default | the web only has the asklinq and booklinq examples. JeongsanNow's main color is in the DDS hue family, so one line is enough |
| 2 | Control heights, text field, list row, bar heights and screen gutter on a touch screen | 40, 48, 56 / 56 / 56, 72 / 64, 80 / 16, 24 | web buttons are 32, 40, 48. The three apps and Material3 defaults |
| 3 | 150ms, the 30ms × 6 stagger, the 24dp shift, the `Travel` easing, the splash 150ms and 1s | JeongsanNow's settled values | the web tokens only have 100, 200, 300 and three easings |
| 4 | Whether a placeholder moves | still | the web pulses at 1600ms. JeongsanNow and Qooroo are still |
| 5 | Card shadow | none, edge only | the web uses `elevation.1`. None of the three apps uses a shadow |
| 6 | The mobile typeface | Pretendard alone | §9 |
| 7 | The large text mode scale and its 56 touch target | JeongsanNow's senior mode values | a feature the web does not have |
| 8 | Bottom tab selection, and the line between bars and content | pill (`bg.brand-subtle`) + `text.brand` + weight 600; a 1dp line | web Tabs use an underline. Selection was reported as too weak |
| 9 | The Material3 role mapping | §3.3 | the web has nothing to map to |
| 10 | Dark status color contrast | **fixed in the tokens (D-049):** danger `red.300` (5.28:1), info `blue.300` (5.74:1) | was 3.62:1 and 4.07:1, below the 4.5:1 of spec §6, on the web too |
| 11 | How dialogs and sheets appear | Material3 defaults | Qooroo's document scales a dialog 0.98→1. Whether that fits "size never changes" needs deciding |
| 12 | How disabled looks | DDS components: opacity 0.45, the value in the web's `button.css`. Material3 components used directly keep their own 38% | the spec only says `opacity` is for disabled; the number lives in CSS, not in a token |
| 13 | When haptic feedback is used | no rule | only Qooroo uses it |
| 14 | Text size inside a field | `body1` (16) | a smaller size makes Android zoom nothing, but 16 matches the list rows beside it |
| 15 | Gap between fields in a form | 16 (in the catalog; not a token) | the web form gap is the product's |
| 16 | Components the web has and Android does not yet | bottom sheet, toast, in-page tabs, pickers, menu use Material3 defaults | §12 |

**Where each item stands (2026-11-10).**

- **Chosen by the owner:** 4 (a placeholder stays still), 5 (a card is set apart by its
  edge only, no shadow), 10 (fix the token values themselves so the dark danger and info
  colors clear 4.5:1 — done in D-049, for the web and Android together).
- **Recommended as "keep the value put in for now", shown to the owner, no objection yet:**
  1, 2, 3, 6, 7, 8, 9, 12, 13, and 11 as "keep the Material3 default; no size change on a
  dialog". These are not confirmed rules until the owner says so.
- **Not yet put to the owner:** 14, 15, 16 (added with the 0.2.0 components).

## 11. Moving an existing app over

1. Add the dependency. `dds-compose` carries six font files (four Pretendard, two Geist
   Mono, about 2.0 MB together). **Delete the app's own copies of those fonts** — two sets
   make the package that much larger.
2. Brand: write the main color in `res/values/dds_brand.xml` (skip it to use the default).
3. Replace the app theme with `DdsTheme`.
4. Replace hex in `res/values*` with `@color/dds_*` (splash, window background, logo).
5. Replace motion constants and helpers with `DdsMotion`, `DdsScreenMotion`,
   `ddsAppear`, `DdsSplashHandoff`, `DdsBusyBar`, `DdsLoadingRows`, `DdsPullRefresh`.
   Check them as in §2.8.
6. Screen by screen, replace height, radius and spacing numbers with `DdsControl`,
   `DdsRadius`, `DdsSpace`. The primary button is `bgBrand` + `textOnBrand`.
7. **Fix the places that used Material3 color roles directly.** The roles now carry the DDS
   mapping, and these four break right after the move (JeongsanNow found them in screenshots).

   | Was written as | What shows after the move | Fix |
   | --- | --- | --- |
   | `colorScheme.surface` as a card face | the card disappears (`surface` is the page background) | a `bgElevated` face + a 1dp `borderDefault` edge |
   | `surfaceContainer` as a pale chip or notice background | the background disappears in light; in dark `bgSubtle` is also the card color | give a neutral chip a 1dp edge |
   | `surfaceVariant` as a face | the line color fills the face | `bgSubtle` |
   | `primary` as a fill with `onPrimary` on it (button, FAB, large choice tile, progress inside a button) | the text color fills the face | `bgBrand` / `textOnBrand` |

   `DdsCard`, `DdsChip`, `DdsNotice` and `DdsButton` (§12) absorb these four.
8. Add a "no hex and no `Color(0x…)` outside the brand file" check to the app
   (see `scripts/check-android-sources.mjs`).

## 12. Components (0.2.0)

Each component reads only generated values and carries the rules above, so a screen
built from them needs no height, radius or color of its own. `android/catalog` shows
all of them (the Parts tab); the web counterpart is named where there is one.

| Component | What it fixes | Web |
| --- | --- | --- |
| `DdsButton` (`Primary` / `Secondary` / `Ghost` / `Danger`; `Sm` 40 / `Md` 48 / `Lg` 56), `DdsIconButton` | one height; `bg.brand` + `text.on-brand`; loading keeps the exact size and is not dimmed; disabled at 0.45; 2dp focus ring; an icon button requires a description and is 48 to touch | Button `[spec §4.2]` |
| `DdsTextField` | label above (never a floating label), 56 high, a message line that is always reserved so an error does not move the form; the error is announced | Field, Input |
| `DdsCheckbox`, `DdsRadio`, `DdsSwitch` | the whole row is the target (48 or more), state is announced | Checkbox, Radio, Switch |
| `DdsCard`, `DdsSection`, `DdsDivider`, `DdsListRow` | `bg.elevated` + 1dp edge + radius 12, no shadow; a section title is a heading; a row is 56 or 72 | Card |
| `DdsNotice`, `DdsBadge`, `DdsChip` | each meaning has its own icon and color pair; a badge repeats the state with a dot; a neutral one gets an edge | Alert, Badge, Tag |
| `DdsEmptyState`, `DdsSpinner` | a dashed outline, a title, one sentence, at most one action | EmptyState, Spinner |
| `DdsTopBar`, `DdsBottomBar`, `DdsNavRail`, `DdsScaffold` | bars are fixed and set apart by a 1dp line; tabs below 600dp, a rail from 600dp; selection changes pill, color and weight together | — (mobile only) |
| `DdsDialog` | confirms a decision; radius 12, `bg.elevated` | Dialog |

Rules that came out of reading the captures (light, dark, 200% font, large text, wide):

- **One row, one height.** Do not put an `Sm` button beside an `Md` one.
- **Text that may wrap breaks between words**, not inside a Korean word: the components
  pass their text through `keepWords()`. Do the same for text you draw yourself.
- **A list row's title may take two lines** at large font sizes; the supporting line may too.
- **Fields are 16 apart.** A message sits 4 below its own box, so it reads as that field's.
- Colors for a radio ring and a checked box come from `text.brand` and `bg.brand`: the
  thin ring needs 3:1 against the page, which `bg.brand` does not reach on white.

Not in 0.2.0: bottom sheet, snackbar/toast, tabs inside a page, date and time pickers,
menus. Use the Material3 ones under `DdsTheme` until they are added.
