"""Language detection for Moroccan legal text (Arabic vs French).

Chunks of Moroccan legal corpus are almost never code-mixed at the chunk
level — a chunk comes from a paragraph that's either Arabic or French.
A character-class ratio is enough; no model needed.
"""
from typing import Literal

Lang = Literal["ar", "fr"]


def _is_arabic_char(ch: str) -> bool:
    code = ord(ch)
    # Arabic (0600-06FF), Arabic Supplement (0750-077F),
    # Arabic Extended-A (08A0-08FF), Arabic Presentation Forms-A (FB50-FDFF),
    # Arabic Presentation Forms-B (FE70-FEFF).
    return (
        0x0600 <= code <= 0x06FF
        or 0x0750 <= code <= 0x077F
        or 0x08A0 <= code <= 0x08FF
        or 0xFB50 <= code <= 0xFDFF
        or 0xFE70 <= code <= 0xFEFF
    )


def _is_latin_letter(ch: str) -> bool:
    return ch.isalpha() and ch.isascii()


def detect_language(text: str, default: Lang = "ar") -> Lang:
    """Return "ar" or "fr" for a chunk of Moroccan legal text.

    Counts Arabic vs Latin letters and picks the majority. Ties and
    text with no letters at all fall back to ``default`` (Arabic, since
    that's the corpus default for this app).
    """
    if not text:
        return default

    ar = 0
    latin = 0
    for ch in text:
        if _is_arabic_char(ch):
            ar += 1
        elif _is_latin_letter(ch):
            latin += 1

    if ar == 0 and latin == 0:
        return default
    return "ar" if ar >= latin else "fr"
