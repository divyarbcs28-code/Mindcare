from transcript_utils import WHISPER_TO_NLLB_LANGUAGE, is_transcript_valid


def test_rejects_empty_transcript():
    assert not is_transcript_valid("")


def test_rejects_repeated_phrase():
    assert not is_transcript_valid("I'm here. " * 10)


def test_accepts_normal_sentence():
    assert is_transcript_valid("I had a difficult day, but I feel better now.")


def test_rejects_low_language_probability():
    assert not is_transcript_valid("This is a complete sentence.", 0.49)


def test_supported_whisper_to_nllb_language_mapping():
    assert WHISPER_TO_NLLB_LANGUAGE == {
        "en": "eng_Latn",
        "ta": "tam_Taml",
        "hi": "hin_Deva",
        "te": "tel_Telu",
        "ml": "mal_Mlym",
        "kn": "kan_Knda",
        "bn": "ben_Beng",
    }
