import re


WHISPER_TO_NLLB_LANGUAGE = {
    "en": "eng_Latn",
    "ta": "tam_Taml",
    "hi": "hin_Deva",
    "te": "tel_Telu",
    "ml": "mal_Mlym",
    "kn": "kan_Knda",
    "bn": "ben_Beng",
}


def is_transcript_valid(text: str, language_probability: float | None = None) -> bool:
    """Return whether a transcript is long enough, non-repetitive, and confidently detected."""
    if not text or len(text.strip()) < 3:
        return False
    if language_probability is not None and language_probability < 0.5:
        return False

    words = re.findall(r"\b[\w’'-]+\b", text.casefold())
    for phrase_length in range(1, len(words) // 4 + 1):
        for start in range(len(words) - phrase_length * 4 + 1):
            phrase = words[start:start + phrase_length]
            repeats = 1
            cursor = start + phrase_length
            while words[cursor:cursor + phrase_length] == phrase:
                repeats += 1
                cursor += phrase_length
            if repeats > 3:
                return False
    return True


def guess_text_language(text: str) -> str:
    """Guess one of the supported Indian scripts in typed text; default to English."""
    script_ranges = (
        ("ta", "\u0b80", "\u0bff"),
        ("hi", "\u0900", "\u097f"),
        ("te", "\u0c00", "\u0c7f"),
        ("ml", "\u0d00", "\u0d7f"),
        ("kn", "\u0c80", "\u0cff"),
        ("bn", "\u0980", "\u09ff"),
    )
    counts = {
        language: sum(start <= char <= end for char in text)
        for language, start, end in script_ranges
    }
    language, count = max(counts.items(), key=lambda item: item[1])
    return language if count else "en"
