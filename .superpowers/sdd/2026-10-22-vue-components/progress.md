# SDD ledger — plan: docs/superpowers/plans/2026-10-22-vue-components.md

Ruling: User explicitly requests proactive Vue inventory and table publication; extend the approved native architecture without another approval. Existing CSS identity stays authoritative; framework APIs use Vue models/slots.
Ruling: Match React AG Grid Community 36.2.0; preserve Solid TanStack unchanged. Cost if wrong: different table engines across framework adapters, documented.
Pre-flight: shared semantic CSS/tokens remain unchanged; native Vue model contracts replace React render props. Table stays separate from basic entry dependency graphs.
Implementation: 41 Vue tests and 2 table tests passed. Native invalid numeric/month/range/time drafts and canonical form IDs reproduced RED then fixed GREEN. Focused browser sorting/filtering/resizing/selection passes; owned select Escape preserves outer dialog.
Packaging: both base and table gates passed packed exports/types/styles/license, public npm dry-run, strict fresh Vue SFC consumer, SSR, and basic input dependency graph. Table README added after this run; final CI repacks it.
Pending: bilingual repository docs, final checks/visual audit, one fresh reviewer, PR/release and EDS published adoption.
Final review: fresh gpt-6-astra reviewer reported four Important runtime issues, zero critical/minor. All enter the single fix pass.
Final: fixed range-calendar completion — browser Oct10→Oct15 test RED (start became15/endempty) → GREEN; shallow tentative selection feeds Ark until complete.
Final: fixed external form ownership — required Month/Time/Range form.checkValidity RED→GREEN; form reaches visible validity inputs.
Final: fixed SelectPicker external form ID — FormData absent RED→GREEN; native HiddenSelect receives form.
Final: fixed NumberInput formatted blur — currency/percent/local digit untouched blur RED→GREEN; preserve rounded original values and parse supported affixes/digits.
Final: Ruling: defer choice virtualization/custom message objects — inventory extension documents differences rather than claiming API parity; cost: consumers needing these options require a later extension.
Final: Ruling: registry publication/downstream adoption are subsequent gates — review covered source only; public tarball and EDS installation will be verified before completion; cost: release remains incomplete until those pass.
Final: Ruling: exhaustive AG Grid features rely on native option forwarding — actual Community sort/filter/resize/selection tested; cost: advanced native integrations remain consumer responsibility.
Visual: manual desktop/narrow light/dark review completed, existing native Select wrapper corrected; scoped secondary text fixes dark contrast. Axe both themes and overflow checks pass. Impeccable detector [] (no findings), no token changes.
