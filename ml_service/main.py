import sys
import tempfile
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
import time
import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline

# Ensure local imports resolve regardless of current working directory
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from audio_features import extract_audio_features
from voice_model import analyze_voice_features
from transcript_utils import guess_text_language, is_transcript_valid

# Ensure Windows cp1252 consoles don't crash on print
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# English-only ".en" Whisper models are more accurate for English than multilingual models of the same size.
WHISPER_MODEL_ID = os.getenv("WHISPER_MODEL_ID", "openai/whisper-base.en")
# Reflections are English-only: the emotion and sentiment models are English models, and a
# translation model (NLLB, ~2.5 GB) does not fit in the memory of the target machines.
REFLECTION_LANGUAGE = "en"
ASR_DEVICE = 0 if torch.cuda.is_available() else -1
ASR_DTYPE = torch.float16 if torch.cuda.is_available() else torch.float32

# .en models only transcribe English and reject the task/language generation arguments.
if WHISPER_MODEL_ID.lower().endswith(".en"):
    WHISPER_LANGUAGE_KWARGS = {}
else:
    WHISPER_LANGUAGE_KWARGS = {"task": "transcribe", "language": REFLECTION_LANGUAGE}

print(f"[INFO] Loading Whisper Model ({WHISPER_MODEL_ID})...")
try:
    whisper_model = pipeline(
        "automatic-speech-recognition",
        model=WHISPER_MODEL_ID,
        device=ASR_DEVICE,
        dtype=ASR_DTYPE,
    )
    print(f"[OK] Whisper loaded on {'GPU' if ASR_DEVICE >= 0 else 'CPU'}.")
except Exception as e:
    print(f"[ERROR] Error loading Whisper: {e}")
    whisper_model = None

print("[INFO] Loading DistilRoBERTa Emotion Model...")
try:
    emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
    print("[OK] Emotion model loaded.")
except Exception as e:
    print(f"[ERROR] Error loading Emotion model: {e}")
    emotion_model = None

print("[INFO] Loading DistilBERT Sentiment Model (SST-2)...")
try:
    sentiment_model = pipeline("text-classification", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")
    print("[OK] Sentiment model loaded.")
except Exception as e:
    print(f"[ERROR] Error loading Sentiment model: {e}")
    sentiment_model = None

# Startup warmup — runs a silent dummy through models to trigger JIT compilation
# so the first real request is not penalised by cold-start overhead.
if whisper_model is not None:
    print("[INFO] Warming up Whisper (dummy inference)...")
    try:
        dummy = np.zeros(1600, dtype=np.float32)
        with torch.inference_mode():
            whisper_model(
                {"raw": dummy, "sampling_rate": 16000},
                chunk_length_s=30,
                return_timestamps=True,
                generate_kwargs={**WHISPER_LANGUAGE_KWARGS, "max_new_tokens": 10},
            )
        print("[OK] Whisper warm.")
    except Exception as _e:
        print(f"[WARN] Warmup failed (non-fatal): {_e}")

if sentiment_model is not None:
    print("[INFO] Warming up Sentiment model...")
    try:
        with torch.inference_mode():
            sentiment_model("MindCare warmup sentence.")
        print("[OK] Sentiment warm.")
    except Exception as _e:
        print(f"[WARN] Sentiment warmup failed (non-fatal): {_e}")

print("[OK] ML Service Ready on port 8000.")


@app.get("/health")
def health():
    xgboost_path = os.path.join(os.path.dirname(__file__), 'xgboost_voice_model.joblib')
    return {
        "status": "ok",
        "whisper_ready": whisper_model is not None,
        "emotion_ready": emotion_model is not None,
        "sentiment_ready": sentiment_model is not None,
        "xgboost_ready": os.path.exists(xgboost_path)
    }


def run_sentiment_analysis(text: str):
    if not sentiment_model:
        return None
    if not text or not text.strip():
        return None
    try:
        t_s = time.time()
        with torch.inference_mode():
            res = sentiment_model(text.strip())[0]
        label = res["label"]  # 'POSITIVE' or 'NEGATIVE'
        confidence = round(float(res["score"]), 4)
        print(f"[TIMING] Sentiment: {time.time() - t_s:.2f}s  result={label} ({confidence})")
        return {
            "sentiment": label,
            "confidence": confidence,
            "model": "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
        }
    except Exception as e:
        print(f"[DEBUG] Sentiment model error: {e}")
        return None


class TextAnalysisRequest(BaseModel):
    text: str


def analyze_reflection_text(text: str) -> dict:
    """Return emotion and sentiment results for English reflection text."""
    if not emotion_model:
        raise HTTPException(status_code=503, detail="Emotion model is not loaded.")
    try:
        with torch.inference_mode():
            emotion_prediction = emotion_model(text)[0]
        emotion_result = {
            "emotion": emotion_prediction["label"],
            "confidence": round(float(emotion_prediction["score"]), 4),
            "model": "j-hartmann/emotion-english-distilroberta-base",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {exc}") from exc

    sentiment_result = run_sentiment_analysis(text)
    if not sentiment_result:
        if not sentiment_model:
            raise HTTPException(status_code=503, detail="Sentiment model is not loaded.")
        raise HTTPException(status_code=500, detail="Sentiment analysis failed.")

    return {
        "original_text": text,
        "english_text": text,
        "detected_language": REFLECTION_LANGUAGE,
        "language_probability": None,
        "emotion": emotion_result["emotion"],
        "emotion_confidence": emotion_result["confidence"],
        "sentiment": sentiment_result["sentiment"],
        "sentiment_confidence": sentiment_result["confidence"],
        "text_analysis": emotion_result,
        "sentiment_analysis": sentiment_result,
    }


@app.post("/analyze-text")
def analyze_text(payload: TextAnalysisRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    text = payload.text.strip()
    if guess_text_language(text) != REFLECTION_LANGUAGE:
        raise HTTPException(status_code=422, detail="Only English reflections are supported. Please write in English.")

    result = analyze_reflection_text(text)
    result["text"] = text
    return result


@app.post("/analyze-sentiment")
def analyze_sentiment(payload: TextAnalysisRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    res = run_sentiment_analysis(payload.text.strip())
    if not res:
        if not sentiment_model:
            raise HTTPException(status_code=503, detail="Sentiment model is not loaded.")
        raise HTTPException(status_code=500, detail="Sentiment analysis failed.")
    return res


def load_audio_16k(path: str) -> tuple[np.ndarray, int]:
    """Decode an audio file to a mono 16 kHz float32 waveform."""
    try:
        audio_array, sample_rate = sf.read(path, dtype='float32')
        print(f"[DEBUG] soundfile loaded: shape={audio_array.shape}, sr={sample_rate}, max_amp={abs(audio_array).max():.4f}")
        # Convert stereo to mono
        if audio_array.ndim > 1:
            audio_array = audio_array.mean(axis=1)
        # Resample to 16kHz if needed — use scipy (112x faster than librosa on CPU)
        if sample_rate != 16000:
            from math import gcd
            from scipy.signal import resample_poly
            g = gcd(16000, int(sample_rate))
            audio_array = resample_poly(audio_array, 16000 // g, int(sample_rate) // g).astype(np.float32)
            sample_rate = 16000
            print(f"[DEBUG] Resampled to 16000 Hz via scipy")
        return audio_array, sample_rate
    except Exception as e:
        print(f"[DEBUG] soundfile failed: {e}. Trying librosa...")
        try:
            import librosa
            audio_array, sample_rate = librosa.load(path, sr=16000, mono=True)
            print(f"[DEBUG] librosa loaded: shape={audio_array.shape}, sr={sample_rate}")
            return audio_array, sample_rate
        except Exception as e2:
            print(f"[DEBUG] librosa also failed: {e2}")
            raise HTTPException(
                status_code=422,
                detail="Could not decode the audio recording, please try again",
            ) from e2


@app.post("/transcribe")
def transcribe(file: UploadFile = File(...)):
    """English speech-to-text plus acoustic features only. The transcript is returned for user review, not analysed."""
    if whisper_model is None:
        raise HTTPException(status_code=503, detail="Speech recognition model is not loaded.")

    suffix = os.path.splitext(file.filename or "")[1] or ".wav"
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        raw_bytes = file.file.read()
        print(f"[DEBUG] /transcribe received: {file.filename}, size: {len(raw_bytes)} bytes")
        with os.fdopen(temp_fd, 'wb') as f:
            f.write(raw_bytes)
        if len(raw_bytes) == 0:
            raise HTTPException(status_code=422, detail="The recording is empty, please record again")

        audio_array, sample_rate = load_audio_16k(temp_path)
        duration_seconds = round(len(audio_array) / sample_rate, 2)

        t_w = time.time()
        warnings = []
        if duration_seconds < 2:
            warnings.append("very_short_recording")

        transcript = ""
        error = None
        try:
            with torch.inference_mode():
                result = whisper_model(
                    {"raw": audio_array, "sampling_rate": sample_rate},
                    chunk_length_s=30,
                    return_timestamps=True,
                    generate_kwargs={**WHISPER_LANGUAGE_KWARGS, "max_new_tokens": 128},
                )
            transcript = result.get("text", "").strip()
        except Exception as exc:
            print(f"[ERROR] Whisper failed: {exc}")
            error = {"message": "Speech recognition failed. You can retry or type what you said.", "retryable": True}
        processing_time_ms = int((time.time() - t_w) * 1000)
        print(f"[TIMING] Whisper: {processing_time_ms}ms transcript='{transcript[:80]}'")

        if error is None and not is_transcript_valid(transcript):
            error = {
                "message": "No clear speech was recognised. Try speaking clearly in English, closer to the microphone, or type what you said.",
                "retryable": True,
            }

        acoustic_features = extract_audio_features(temp_path, y=audio_array, sr=sample_rate)
        voice_status = analyze_voice_features(acoustic_features)

        return {
            "transcription": {
                "status": "failed" if error else "ok",
                "text": "" if error else transcript,
                "language": REFLECTION_LANGUAGE,
                "language_probability": None,
                "language_source": "english_only",
                "model": WHISPER_MODEL_ID,
                "processing_time_ms": processing_time_ms,
                "warnings": warnings,
                "error": error,
            },
            "audio": {"duration_seconds": duration_seconds},
            "acoustic_features": {
                "features_extracted": acoustic_features.get("success", False),
                "pitch_variation": acoustic_features.get("pitch_variation", 0.0),
                "energy": acoustic_features.get("energy", 0.0),
                "pause_duration": acoustic_features.get("pause_duration", 0.0),
                "duration": acoustic_features.get("duration", 0.0),
            },
            "voice_analysis": {
                "features_extracted": acoustic_features.get("success", False),
                "model_status": voice_status["model_status"],
                "deviation_score": voice_status["deviation_score"],
                "message": voice_status["message"],
            },
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.post("/analyze-voice")
def analyze_voice(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No audio file provided")

    # Save the received file as .wav
    temp_fd, temp_path = tempfile.mkstemp(suffix=".wav")
    try:
        raw_bytes = file.file.read()
        print(f"[DEBUG] Received file: {file.filename}, size: {len(raw_bytes)} bytes, content_type: {file.content_type}")

        with os.fdopen(temp_fd, 'wb') as f:
            f.write(raw_bytes)

        if len(raw_bytes) == 0:
            raise HTTPException(status_code=422, detail="Could not understand the audio, please try again")

        # 1. Load audio
        audio_array, sample_rate = load_audio_16k(temp_path)

        if audio_array is None or whisper_model is None:
            raise HTTPException(status_code=503, detail="Speech recognition model is not available.")

        generate_kwargs = {**WHISPER_LANGUAGE_KWARGS, "max_new_tokens": 128}

        try:
            t_w = time.time()
            with torch.inference_mode():
                result = whisper_model(
                    {"raw": audio_array, "sampling_rate": sample_rate},
                    chunk_length_s=30,
                    return_timestamps=True,
                    generate_kwargs=generate_kwargs,
                )
            transcript = result.get("text", "").strip()
            print(f"[TIMING] Whisper: {time.time() - t_w:.2f}s transcript='{transcript[:80]}'")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Speech recognition failed: {exc}") from exc

        if not is_transcript_valid(transcript):
            raise HTTPException(
                status_code=422,
                detail="Could not understand the audio, please try again",
            )

        text_analysis = analyze_reflection_text(transcript)

        # 4. Acoustic Features (uses already decoded & resampled audio_array)
        acoustic_features = extract_audio_features(temp_path, y=audio_array, sr=sample_rate)
        print(f"[DEBUG] Acoustic features success: {acoustic_features.get('success')}")

        # 5. XGBoost Placeholder
        voice_status = analyze_voice_features(acoustic_features)

        return {
            "transcript": transcript,
            **text_analysis,
            "acoustic_features": {
                "features_extracted": acoustic_features.get("success", False),
                "pitch_variation": acoustic_features.get("pitch_variation", 0.0),
                "energy": acoustic_features.get("energy", 0.0),
                "pause_duration": acoustic_features.get("pause_duration", 0.0),
                "duration": acoustic_features.get("duration", 0.0)
            },
            "voice_analysis": {
                "features_extracted": acoustic_features.get("success", False),
                "model_status": voice_status["model_status"],
                "deviation_score": voice_status["deviation_score"],
                "message": voice_status["message"]
            },
            "fusion": {
                "label": "Reflection Analyzed",
                "message": build_fusion_message(text_analysis["emotion"], acoustic_features.get("success", False))
            },
            "trend": {
                "status": "Building trend from your reflections"
            }
        }

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


def build_fusion_message(emotion, features_extracted):
    if emotion in ["sadness", "anger", "fear", "disgust"]:
        msg = f"A {emotion}-related emotional expression was detected in your reflection. "
    else:
        msg = "The transcript shows a relatively neutral or positive emotional expression. "
    if features_extracted:
        msg += "Acoustic features were successfully extracted from your recording."
    else:
        msg += "Acoustic feature extraction encountered an issue."
    return msg


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
