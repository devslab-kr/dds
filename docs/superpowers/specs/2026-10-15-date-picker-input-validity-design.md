# DDS DatePicker draft validity design (preparation only)

## Scope and evidence

Base: official devslab-kr/dds local C:/Users/jlc48/code/workspace/dds, HEAD 4301ae55e12ae63c76585cf7c3fbfe9ca59ec7a8. Isolated worktree dds-date-picker-controls / feat/date-picker-input-validity. No applicable AGENTS.md found at ancestor paths or inside this checkout. Existing React Ark design is docs/superpowers/specs/2026-10-11-react-ark-aggrid-design.md. Source version0.21.0 DatePicker equals published0.21.1 installed source map; this does not identify published release commit or other owners' heads.

Approved now: specification, plan and regression source only. Production component/package/lock changes, installs, tests, build, browser processes, publishing and commits remain HOLD. CUA owner exclusively performs real browser verification after a separate server/runtime grant. No terminal Playwright execution. Existing canonical onChange contract remains compatible.

Actual root-owned browser evidence: valid2028-02-28 -> keyboard invalid2027-02-29 -> Save posts previous2028-02-28. Ark5.39.3/Zag1.45.0 inputValue changes do not invoke selected-value onValueChange. Default Input fixOnBlur=true chooses selectParsedDate; invalid input falls back to focusedValue. Enter separately selects focused date even when parsing fails. fixOnBlur=false alone does not expose invalid draft or protect consumer Save.

## Minimal public addition

```ts
export interface DatePickerValidity {
  inputValue: string;
  valid: boolean;
  reason: 'valid' | 'required' | 'incomplete' | 'invalid'
    | 'rangeUnderflow' | 'rangeOverflow';
}
// Add to existing DatePickerProps:
required?: boolean;
readOnly?: boolean;
onValidityChange?: (state: DatePickerValidity) => void;
```

No unrestricted inputProps bag is needed. onValidityChange includes the exact available draft and reports initial/external value changes, every user edit, calendar selection, Today/Clear and required/min/max changes. Equality-dedupe prevents rerender loops; latest callback identity must not trigger repeated semantic events. onChange still emits only canonical real in-range YYYY-MM-DD or intentional clear ''. Invalid/incomplete drafts never emit the old selection as a replacement. Consumers may keep prior canonical state but MUST use the validity event when saving.

Existing label remains caller-provided. required is forwarded to Field and Ark Root/Input; existing Field supplies visual required marker/aria-required. Invalid draft gets aria-invalid and an accessible linked error. Error copy must follow shared DDS localization conventions/caller labeling rather than introduce product legal copy. Native custom validity is set on the real visible input ref inside the common component (not consumer DOM mutation); clear custom error when valid. Native required and custom validity protect real form submission. Arbitrary onClick/API Save must also guard onValidityChange.valid; library-only PASS never proves a consumer safe.

## Parsing and model ownership

1. Strict date-only parser validates exact ASCII YYYY-MM-DD with no implicit trim, 4digit year0001..9999, month01..12 and Gregorian day range/leap rules. No Date.parse/new Date normalization/timezone conversion; validate first, then parseDate only proven canonical strings. This parser covers value/min/max/manual commit; min/max configuration also cannot throw while rendering. Empty means optional-valid/required-invalid. A proper prefix of canonical pattern is incomplete; full but nonexistent date is invalid. Noncanonical nonprefix text invalid. Preserve raw text actually accepted by input; do not silently repair invalid persisted defaults or save ''.
2. Keep exact displayed draft separately from Ark selected CalendarDate[]. Invalid initial controlled value renders its raw text and error with empty calendar selection instead of parse crash. Existing canonical initial date selects normally. Initial callback must mark invalid state before a consumer action can save. SSR emits stable draft/error markup; effects/ref setup only attach native validity and callback notification.
3. Use Ark Input fixOnBlur=false. Valid drafts commit on blur/Enter (calendar selection may commit immediately). Invalid/incomplete blur preserves draft; invalid Enter prevents old-focus selection and prevents invalid form submission. Account for Ark merged handlers: merely passing preventDefault in a later handler may not stop earlier library handler; choose a supported event boundary proven by RED/GREEN tests. Do not reconstruct calendar or rely on DOM mutation in a product adapter.
4. Calendar select/Today/Clear synchronize draft+validity+canonical callback; intentional clear emits '' even when required (validity false). Disabled/readOnly prevent editing and trigger opening and close active portal on transition. Keep calendar/date-only locale/timeZone behavior, stable focus and existing keyboard navigation. No loss of focus due to remount on every keystroke.
5. External value reset replaces pending draft; parent echo of this component's own canonical commit must not erase newer in-progress draft. Track event origin/last committed value, not only string equality. Config changes revalidate draft and range; ranges compare canonical dates without local timezone. Out-of-range draft remains visible/invalid rather than silently clamped.
6. Preserve completed calendar UI and portal; no calendar fork, hidden required input, product DOM mutation, package upgrade, broad refactor or Solid API expansion. Documentation must describe validity consumer obligation and optional clear behavior.

## Source-only regressions prepared

packages/dds-react/src/__tests__/date-picker-validity.test.tsx imports the existing DatePicker source module directly (the same exported component, without unrelated index reexports), uses actual React/Ark and user-event (no component mocks or new missing imports). Proposed props use an object spread so the old component can execute and fail semantic assertions rather than missing-type/import setup errors. The local callback type must be replaced by the public export during implementation and an actual declaration usage check must then verify API presence. Cases: leap invalid blur; partial Enter; validity while focused; min/max overflow/underflow; valid correction; optional/required clear; invalid persisted render; external reset; readOnly; disabled portal transition. These are UNEXECUTED candidates, not observed RED results.

CUA-only fixture: packages/react-canary/date-picker-validity.html -> src/date-picker-validity-fixture.tsx. It imports the real built workspace DatePicker/styles. Existing canary Vite handles the HTML without changing main.tsx or package/config. Form Save exercises native constraints; API Save exercises callback validity guard. It shows canonical value, draft validity, memory Save count/bodies and status. No duplicated parser. The hand-checked default valid initial state allows the old component's stale-save behavior to be exposed; it is not permanently fail-closed when callback is absent. Custom initial values start unknown until DDS callback and must not be used as baseline-positive evidence.

The fixture records memory consumer actions only; it does not issue HTTP POST and cannot by itself prove Admin/Contract POST safety. Root's actual Admin memory-POST fixture must be retested after integration. No synthetic DOM event or forced value write substitutes for CUA keyboard typing.

CUA recipe after runtime grant:
- Fresh fixture default: Form Save then API Save each increments memory count and records2028-02-28 (positive control); reload between independent cases.
- Select text with keyboard Ctrl+A, type2027-02-29 character by character. Verify exact draft while focused and callback invalid. Click API Save: statusBlocked, count0, bodies[]. Blur/Tab and Enter separately must retain draft with count0; Form Save also cannot commit.
- Correct to2028-02-29; blur then API Save exactly once; count1/bodydate2028-02-29. No old2028-02-28 body.
- Repeat partial2027-02-, required clear via ?required=1, optional clear, ?min=2028-02-28&max=2028-03-01, out-of-range input, ?initial=2027-02-29, calendar selection/Today/Clear, Escape focus return, disable/readOnly while portal open, external reset after invalid draft, timezone locale/date-only edges. Snapshot before/after blur and queued updates.

## Completion boundary

After observed focused RED, implement only shared parser/draft/validity/constraints changes, then focused GREEN plus existing DatePicker regression, React SSR/check/build and source docs/public declarations. A supported CUA browser run must validate real typing and submit sequencing. Root coordinates concrete patch review, release and downstream integration separately; no credential registration. Product Save must use the validity guard and its own authoritative validation; exact published artifact and latest supported range/lock integration follow only after verified common fix.