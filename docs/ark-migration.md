# DDS internal Ark UI integration

DDS retains its public API and design tokens in the existing `@devslab/dds-solid` package.
Ark UI is the internal accessibility and interaction engine. No separate wrapper package or new design system is created.

| DDS API | Implementation | Consumer contract |
| --- | --- | --- |
| Tabs / TabList / Tab / TabPanel | Ark Tabs | String callbacks, automatic keyboard selection, retained inactive panel instances |
| Dialog | Ark Dialog | Boolean callbacks, focus trap/return, outside-click and Escape policies |
| Tooltip | Ark Tooltip | Existing render prop; spread all supplied attributes onto the trigger |
| Checkbox / Switch | Ark headless hooks + DDS native input | Boolean callbacks, name/value/form/required, DDS CSS |
| Field | Ark Field + DDS control props | Existing function children and label/help/error associations |
| ToastProvider / useToast | Ark toaster | show/dismiss/clear, DDS tone/message, localized dismiss names |
| RadioGroup | Ark RadioGroup | Options array, string selection, native forms and grouped arrow navigation |
| Radio / Button / IconButton / Select | Existing native elements | Existing API |

## Consumer integration

Import `@devslab/dds-solid/styles.css` once in the application shell.
Ark is a DDS runtime dependency; consumers do not need to use Ark APIs or add separate installation configuration.
State callbacks return DDS boolean/string values rather than Ark details objects.
Routing, authorization, server requests and domain state remain consumer responsibilities.

Standalone `Radio` keeps its checked API instead of becoming a one-item Ark group.
Use `RadioGroup` for new code requiring grouped keyboard navigation.
`TooltipTriggerProps` describes actual DOM trigger attributes. Spread the entire render-prop argument;
legacy zero-argument trigger callbacks remain supported. Prefer `open`/`onOpenChange` for programmatic state changes.

Normally use an application-level ToastProvider; multiple providers keep independent queues and DOM IDs. Inject localized `regionLabel` and `dismissLabel` values.
Non-positive durations persist until dismissal; pointer/focus interaction and inactive pages pause expiry.
Hidden Tabs panels preserve instances but do not automatically suspend effects or server requests.

## Verification

Run `pnpm --filter @devslab/dds-solid test`, `check`, `build`, and `node --test tests/dds-solid-contracts.test.mjs`.
Start the browser fixture from the package directory with `pnpm exec vite --config vite.preview.config.ts`.
Connect a Playwright CLI session to the page and run `run-code --filename scripts/verify-ark-browser.cjs`
to verify retained tabs, arrows, native forms, Dialog, Tooltip and Toast at desktop and mobile sizes.
jsdom lacks ResizeObserver and layout; component tests document these limits and are supplemented by real-browser checks.

Homepage credits use `Built with Ark UI · Designed by DevsLab` to acknowledge the actual dependency.
These are source changes; they do not imply production deployment or npm publication.
