"""Build the static fonts dds-compose ships, from the variable fonts site-kit already vendors.

    python scripts/build-android-fonts.py        (needs: pip install fonttools brotli)

Run by hand when the source fonts change; the output is committed. Android
picks a font file per weight, so the variable web fonts are pinned to static
instances, then cut down to what Korean and Latin UI text needs:

  Pretendard 400/500/600/700 — Basic Latin, Latin-1, general punctuation,
      arrows, CJK punctuation, Hangul compatibility jamo and the 2,350
      KS X 1001 syllables. About 0.4 MB per weight instead of about 3 MB.
  Geist Mono 400/500 — the Latin subset site-kit ships.

Same sources as the web (packages/site-kit/fonts, see its manifest.json), so
web and Android draw the same letterforms.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "packages" / "site-kit" / "fonts"
MODULE = ROOT / "android" / "dds-compose"
OUT = MODULE / "src" / "main" / "res" / "font"
LICENSES = MODULE / "licenses"


def ks_x_1001_syllables() -> list[int]:
    """The 2,350 Hangul syllables of KS X 1001: rows 0xB0-0xC8, cells 0xA1-0xFE of EUC-KR.

    Built from the code table itself, not by asking a codec what it can encode —
    Python's euc_kr codec also accepts the 8,822 syllables KS X 1001 leaves out.
    """
    return [
        ord(bytes([lead, trail]).decode("euc_kr"))
        for lead in range(0xB0, 0xC9)
        for trail in range(0xA1, 0xFF)
    ]


PRETENDARD_UNICODES = [
    *range(0x0020, 0x007F),  # Basic Latin
    *range(0x00A0, 0x0100),  # Latin-1 Supplement
    *range(0x2010, 0x2028),  # dashes, quotes, bullets, ellipsis
    0x2030, 0x2032, 0x2033, 0x203B,  # per mille, primes, reference mark
    0x20A9, 0x20AC,  # won, euro
    0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x00D7,
    *range(0x3000, 0x3020),  # CJK punctuation
    *range(0x3131, 0x318F),  # Hangul compatibility jamo
    0xFF01, 0xFF08, 0xFF09, 0xFF0C, 0xFF1A, 0xFF1F, 0xFF5E,  # full-width punctuation seen in Korean text
    *ks_x_1001_syllables(),
]

BUILDS = [
    # (source, weight, output name, unicodes or None to keep the source's own subset)
    ("pretendard/PretendardVariable.woff2", 400, "pretendard_regular.ttf", PRETENDARD_UNICODES),
    ("pretendard/PretendardVariable.woff2", 500, "pretendard_medium.ttf", PRETENDARD_UNICODES),
    ("pretendard/PretendardVariable.woff2", 600, "pretendard_semibold.ttf", PRETENDARD_UNICODES),
    ("pretendard/PretendardVariable.woff2", 700, "pretendard_bold.ttf", PRETENDARD_UNICODES),
    ("geist-mono/geist-mono-latin-wght-normal.woff2", 400, "geist_mono_regular.ttf", None),
    ("geist-mono/geist-mono-latin-wght-normal.woff2", 500, "geist_mono_medium.ttf", None),
]


def build(source: str, weight: int, name: str, unicodes: list[int] | None) -> int:
    font = TTFont(SOURCES / source)
    font = instancer.instantiateVariableFont(font, {"wght": weight})
    if unicodes is not None:
        options = subset.Options()
        options.layout_features = ["kern", "mark", "mkmk", "tnum", "case", "locl", "calt"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=unicodes)
        subsetter.subset(font)
    font.flavor = None  # Android reads TTF, not WOFF2
    target = OUT / name
    font.save(target)
    return target.stat().st_size


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    LICENSES.mkdir(parents=True, exist_ok=True)
    for source, weight, name, unicodes in BUILDS:
        size = build(source, weight, name, unicodes)
        print(f"{name}: {size / 1024:.0f} KB (wght {weight})")
    shutil.copyfile(SOURCES / "pretendard" / "LICENSE.txt", LICENSES / "Pretendard-OFL.txt")
    shutil.copyfile(SOURCES / "geist-mono" / "LICENSE.txt", LICENSES / "GeistMono-OFL.txt")


if __name__ == "__main__":
    main()
