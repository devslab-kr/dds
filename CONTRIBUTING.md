# Contributing to DDS

DDS (DevsLab Design System) is **source-available, not open source**. The
code is public and you are welcome to read it, report issues, and propose
changes, but the [DevsLab Source-Available License 1.0](./LICENSE) governs
all use — it does not permit modification, redistribution, or building a
competing design system.

## Contribution license grant

By submitting a contribution (a pull request, patch, issue text, or any
other material) to this repository, you agree that:

- you have the right to submit it, and it is your own work or work you are
  authorized to submit;
- you grant DevsLab a perpetual, worldwide, irrevocable, royalty-free,
  sublicensable license to use, modify, relicense, and distribute your
  contribution as part of the Software, without further obligation to you;
- your contribution is provided under the same feedback terms as Section 3
  of the LICENSE, and no compensation or attribution is owed beyond the
  repository's commit history.

If you cannot agree to this, please open an issue describing the problem
instead of sending code.

## What we accept

- Bug reports and reproduction cases — always welcome.
- Fixes for defects (broken tokens, contrast failures, a11y issues,
  build/test problems).
- Documentation corrections, including keeping the English/Korean pairs in
  sync.

New components, new tokens, and foundation (§3) changes are driven by
DevsLab product needs and the decision log; open an issue to discuss before
writing code.

## Ground rules (from the spec)

- Tokens are the single source of truth — no hardcoded hex/px in components
  or examples. Components reference semantic tokens only.
- Light is the default theme; dark is a semantic remapping, never an
  `if (dark)` branch.
- Text on cyan surfaces uses `zinc.950`, never white.
- Accessibility floor: 4.5:1 text contrast, focus-visible rings, labels on
  icon-only buttons, reduced-motion respected.
- Docs ship in English/Korean pairs (`*.md` + `*.ko.md`) — edit both.
- If the docs table and `tokens/*.json` disagree, fix both sides in the
  same change.

## Development

```bash
pnpm install --frozen-lockfile
pnpm run build          # build all packages
pnpm run check          # package checks + docs/token sync
pnpm run verify         # build + check (what CI runs first)
```

Foundation-affecting changes need an entry in `docs/decisions.md`.
Releases are cut by DevsLab via `dds-v*` tags; contributors never publish.
