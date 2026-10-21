# MindCare

MindCare is a React wellbeing check-in app with a Node.js/Express and MongoDB backend and a FastAPI ML service.

## Reflections (English only)

Reflections are English-only. Voice is transcribed with the Hugging Face Transformers Whisper model `openai/whisper-tiny` (forced to English), and the text is analysed by English emotion and sentiment models. Typed reflections written in a non-Latin Indian script are rejected with a clear message. Translation (NLLB) was removed because the ~2.5 GB model does not fit in the memory of the development laptops.

Voice reflections work in two steps: `POST /api/reflections/transcribe` returns the transcript and acoustic features for the user to review, then `POST /api/reflections/confirm-voice` analyses and saves the confirmed text.

The ML service decodes uploaded audio with `soundfile` (and falls back to `librosa`) before passing the audio samples directly to Whisper. FFmpeg is not required for WAV uploads.

Install the Python dependencies and run the service:

```powershell
cd ml_service
python -m pip install -r requirements.txt
python main.py
```

### Model environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `WHISPER_MODEL_ID` | `openai/whisper-tiny` | Whisper model used for transcription. A larger multilingual model such as `openai/whisper-base` or `openai/whisper-small` is more accurate but needs more memory. Do not use an `.en` model. |

### Tests

Run the transcript validation tests from the repository root:

```powershell
python -m pytest ml_service/test_transcript_utils.py
```
