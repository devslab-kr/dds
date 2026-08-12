# DDS — DevsLab Design System

🌐 [한국어](README.ko.md)

The design language for DevsLab products (devslab.kr, the Linq family, and
future apps): one set of tokens and rules shared by web and mobile.
Structurally modeled on [Toss Design System (TDS)](https://tossmini-docs.toss.im/tds-react-native/),
but framework-neutral — the core is tokens + CSS; React, Vue, Ionic, and
React Native are consumers.

## What's here

| Path | Contents |
| --- | --- |
| [`docs/design-system.md`](docs/design-system.md) | The rules spec (v0): principles, architecture, foundations, component contract, governance |
| [`tokens/`](tokens/) | Phase 0 design tokens ([W3C format](https://design-tokens.github.io/community-group/format/)): raw palette, light/dark semantic mappings, typography/spacing/radius/elevation/motion |
| [`preview/index.html`](preview/index.html) | Self-contained foundations & components preview — open in a browser |
| [`brand/index.html`](brand/index.html) | Brand identity guide: logo rules, Electric Cyan, motifs, voice & tone |

## Brand anchors

- **Electric Cyan** `#06B6D4` (hover `#22D3EE`) on **zinc** neutrals — extracted
  from devslab.kr's live styles
- Light default + dark toggle; both semantic mappings are first-class
- Geist / Geist Mono; Korean falls back to Pretendard → system gothic
- Text on cyan surfaces is `zinc.950`, not white (WCAG AA: 2.3:1 vs ~8:1)

## Roadmap

Planned packages (created only when a consumer exists — see spec §8):
`@devslab-kr/dds-tokens` → `dds-css` → `dds-icons` → `dds-native` (RN) or an
Ionic theme mapping, depending on how mobile goes.
