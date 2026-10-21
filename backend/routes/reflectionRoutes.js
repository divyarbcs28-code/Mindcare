import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import Reflection from '../models/Reflection.js';
import AnalysisResult from '../models/AnalysisResult.js';
import { requireActivityAuth as requireAuth } from '../middleware/activityAuth.js';

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_SERVICE_TIMEOUT = Number(process.env.ML_SERVICE_TIMEOUT) || 120000;

function mlUnavailableMessage(error) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return 'Reflection analysis is unavailable because the ML service is not connected. The website and database may still be working; the ML service needs to be deployed and ML_SERVICE_URL configured.';
  }
  return error.response?.data?.detail || error.message || 'The ML service could not analyze this reflection.';
}

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
const upload = multer({ dest: 'uploads/' });

const NEGATIVE_EMOTIONS = ['sadness', 'anger', 'fear', 'disgust'];

// Summary of a voice reflection that keeps the emotion and sentiment results consistent with each other.
function buildFusionMessage(emotion, sentiment, featuresExtracted) {
  const negativeSentiment = String(sentiment || '').toUpperCase() === 'NEGATIVE';
  let message;
  if (NEGATIVE_EMOTIONS.includes(emotion)) {
    message = `A ${emotion}-related emotional expression was detected in the transcript. `;
  } else if (emotion === 'joy') {
    message = 'The transcript shows a positive emotional expression. ';
  } else {
    message = `The transcript shows a ${emotion === 'surprise' ? 'surprised' : 'neutral'} emotional expression. `;
  }
  if (sentiment) {
    message += negativeSentiment
      ? 'The overall tone of what you said is negative. '
      : 'The overall tone of what you said is positive. ';
  }
  message += featuresExtracted
    ? 'Acoustic features were successfully extracted from your recording.'
    : 'Acoustic feature extraction is pending.';
  return message;
}

// ML Service Health Check
router.get('/health', async (req, res) => {
  try {
    const pyRes = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
    res.json({
      status: 'ok',
      node_backend: 'healthy',
      ml_service: pyRes.data
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      node_backend: 'healthy',
      ml_service: {
        status: 'unreachable',
        error: err.message,
        target: `${ML_SERVICE_URL}/health`
      }
    });
  }
});

// Analyze typed text directly without file
router.post('/analyze-text', async (req, res) => {
  try {
    const { text, language = 'auto' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const pyRes = await axios.post(`${ML_SERVICE_URL}/analyze-text`, {
      text: text.trim(),
      language,
    }, { timeout: 60000 });

    res.json(pyRes.data);
  } catch (err) {
    console.error("Text analysis error:", err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
      error: mlUnavailableMessage(err),
      code: err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' ? 'ML_UNAVAILABLE' : 'ML_ERROR',
    });
  }
});

// Step 1 of a voice reflection: speech-to-text + acoustic features only. Nothing is saved.
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No audio recording was uploaded.', retryable: true });
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), {
      filename: file.originalname || 'reflection.wav',
      contentType: file.mimetype || 'audio/wav',
    });
    formData.append('language', req.body.language || 'auto');

    const pyRes = await axios.post(`${ML_SERVICE_URL}/transcribe`, formData, {
      headers: formData.getHeaders(),
      timeout: ML_SERVICE_TIMEOUT,
      maxBodyLength: Infinity,
    });
    return res.json(pyRes.data);
  } catch (pyErr) {
    console.error('Transcription error:', pyErr.message);
    const isConnRefused = pyErr.code === 'ECONNREFUSED' || pyErr.code === 'ENOTFOUND';
    const isTimeout = pyErr.code === 'ECONNABORTED' || pyErr.message?.includes('timeout');

    let message = 'Transcription failed in the ML service.';
    if (isConnRefused) {
      message = `Python ML Service is unreachable at ${ML_SERVICE_URL}. Please ensure the FastAPI server is running on port 8000.`;
    } else if (isTimeout) {
      message = `Python ML Service timed out after ${ML_SERVICE_TIMEOUT / 1000}s. Try a shorter recording.`;
    }

    return res.status(pyErr.response?.status || 503).json({
      error: pyErr.response?.data?.detail || message,
      code: isConnRefused ? 'ML_UNREACHABLE' : isTimeout ? 'ML_TIMEOUT' : 'ML_ERROR',
      retryable: true,
    });
  } finally {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
});

router.post('/confirm-voice', requireAuth, async (req, res) => {
  try {
    // Owner comes from the signed session token, never from the request body.
    const userId = req.activityUserId;
    const {
      transcript,
      language = 'auto',
      language_probability,
      acousticFeatures = {},
      voiceAnalysis = {},
    } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }
    if (typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript cannot be empty.' });
    }

    const text = transcript.trim();
    const pyRes = await axios.post(`${ML_SERVICE_URL}/analyze-text`, {
      text,
      language,
    }, { timeout: 60000 });
    const mlResponse = pyRes.data;
    const emotion = mlResponse.text_analysis?.emotion || 'neutral';
    const sentiment = mlResponse.sentiment_analysis?.sentiment || '';
    const numericFeature = (value) => Number.isFinite(value) ? value : 0;
    const savedAcousticFeatures = {
      pitchVariation: numericFeature(acousticFeatures.pitchVariation),
      energy: numericFeature(acousticFeatures.energy),
      pauseDuration: numericFeature(acousticFeatures.pauseDuration),
    };
    const deviationScore = numericFeature(voiceAnalysis.deviation_score);

    const reflection = await Reflection.create({
      userId,
      type: 'voice',
      audioUrl: 'local_processed',
      transcript: text,
    });

    await AnalysisResult.create({
      reflectionId: reflection._id,
      userId,
      analysisType: 'voice',
      emotionCategory: emotion,
      confidenceScore: mlResponse.text_analysis?.confidence || 0,
      sentimentCategory: sentiment,
      sentimentScore: mlResponse.sentiment_analysis?.confidence || 0,
      original_text: mlResponse.original_text || text,
      english_text: mlResponse.english_text || text,
      detected_language: mlResponse.detected_language || language,
      themeTags: [emotion],
      acousticFeatures: savedAcousticFeatures,
      deviationScore,
      resultId: `result_${Date.now()}`,
    });

    const fusionMessage = buildFusionMessage(emotion, sentiment, voiceAnalysis.features_extracted);

    return res.status(201).json({
      transcript: text,
      original_text: mlResponse.original_text || text,
      english_text: mlResponse.english_text || text,
      detected_language: mlResponse.detected_language || language,
      language_probability: language_probability ?? mlResponse.language_probability ?? null,
      emotion: mlResponse.emotion || emotion,
      emotion_confidence: mlResponse.emotion_confidence ?? mlResponse.text_analysis?.confidence ?? 0,
      sentiment: mlResponse.sentiment || sentiment,
      sentiment_confidence: mlResponse.sentiment_confidence ?? mlResponse.sentiment_analysis?.confidence ?? 0,
      text_analysis: mlResponse.text_analysis,
      sentiment_analysis: mlResponse.sentiment_analysis,
      voice_analysis: voiceAnalysis,
      acoustic_features: savedAcousticFeatures,
      fusion: { label: 'Reflection Analyzed', message: fusionMessage },
      trend: { status: 'Building trend from your reflections' },
    });
  } catch (err) {
    console.error('Voice reflection confirmation error:', err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
      error: err.response?.data?.detail || err.message || 'Failed to analyze corrected transcript.',
    });
  }
});

router.post('/', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.activityUserId;
    const file = req.file;
    const rawText = req.body.text || req.body.content || req.body.transcript;

    if (!userId) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'userId is required.' });
    }

    // Case 1: Voice reflection (audio file provided)
    if (file) {
      let mlResponse;

      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), {
          filename: 'recording.wav',
          contentType: 'audio/wav',
        });
        formData.append('language', req.body.language || 'auto');

        const pyRes = await axios.post(`${ML_SERVICE_URL}/analyze-voice`, formData, {
          headers: formData.getHeaders(),
          timeout: ML_SERVICE_TIMEOUT,
        });
        mlResponse = pyRes.data;
      } catch (pyErr) {
        console.error("Python ML Service error:", pyErr.message);
        const isConnRefused = pyErr.code === 'ECONNREFUSED' || pyErr.code === 'ENOTFOUND';
        const isTimeout = pyErr.code === 'ECONNABORTED' || pyErr.message?.includes('timeout');

        let clientMessage = 'ML service error during voice analysis.';
        if (isConnRefused) {
          clientMessage = `Python ML Service is unreachable at ${ML_SERVICE_URL}. Please ensure the FastAPI server is running on port 8000.`;
        } else if (isTimeout) {
          clientMessage = `Python ML Service timed out after ${ML_SERVICE_TIMEOUT / 1000}s.`;
        }

        return res.status(pyErr.response?.status || 503).json({
          error: pyErr.response?.data?.detail || clientMessage,
          details: pyErr.message,
          service: 'ml_service',
          target: `${ML_SERVICE_URL}/analyze-voice`
        });
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }

      // Fusion Logic
      const emotion = mlResponse.text_analysis?.emotion || 'neutral';
      const sentiment = mlResponse.sentiment_analysis?.sentiment || '';
      const fusionMessage = buildFusionMessage(emotion, sentiment, mlResponse.voice_analysis?.features_extracted);

      const resultId = `result_${Date.now()}`;
      const acousticFeatures = {
        pitchVariation: typeof mlResponse.acoustic_features?.pitch_variation === 'number'
          ? mlResponse.acoustic_features.pitch_variation
          : 0.0,
        energy: typeof mlResponse.acoustic_features?.energy === 'number'
          ? mlResponse.acoustic_features.energy
          : 0.0,
        pauseDuration: typeof mlResponse.acoustic_features?.pause_duration === 'number'
          ? mlResponse.acoustic_features.pause_duration
          : 0.0,
      };

      if (req.body.reviewTranscript === 'true') {
        if (!mlResponse.transcript?.trim() || mlResponse.transcript.startsWith('Could not transcribe')) {
          return res.status(422).json({ error: 'Could not understand the audio, please try again' });
        }
        return res.status(200).json({
          transcript: mlResponse.transcript,
          original_text: mlResponse.original_text,
          english_text: mlResponse.english_text,
          detected_language: mlResponse.detected_language,
          language_probability: mlResponse.language_probability,
          emotion: mlResponse.emotion,
          emotion_confidence: mlResponse.emotion_confidence,
          sentiment: mlResponse.sentiment,
          sentiment_confidence: mlResponse.sentiment_confidence,
          text_analysis: mlResponse.text_analysis,
          sentiment_analysis: mlResponse.sentiment_analysis,
          voice_analysis: mlResponse.voice_analysis,
          acoustic_features: acousticFeatures,
        });
      }

      // Save to MongoDB
      const reflection = await Reflection.create({
        userId,
        type: 'voice',
        audioUrl: 'local_processed',
        transcript: mlResponse.transcript,
      });

      await AnalysisResult.create({
        reflectionId: reflection._id,
        userId,
        analysisType: 'voice',
        emotionCategory: emotion,
        confidenceScore: mlResponse.text_analysis?.confidence || 0.0,
        sentimentCategory: mlResponse.sentiment_analysis?.sentiment || '',
        sentimentScore: mlResponse.sentiment_analysis?.confidence || 0.0,
        original_text: mlResponse.original_text || mlResponse.transcript,
        english_text: mlResponse.english_text || mlResponse.transcript,
        detected_language: mlResponse.detected_language || req.body.language || 'auto',
        themeTags: [emotion],
        acousticFeatures,
        deviationScore: mlResponse.voice_analysis?.deviation_score || 0.0,
        resultId,
      });

      return res.status(201).json({
        transcript: mlResponse.transcript,
        original_text: mlResponse.original_text,
        english_text: mlResponse.english_text,
        detected_language: mlResponse.detected_language,
        language_probability: mlResponse.language_probability,
        emotion: mlResponse.emotion,
        emotion_confidence: mlResponse.emotion_confidence,
        sentiment: mlResponse.sentiment,
        sentiment_confidence: mlResponse.sentiment_confidence,
        text_analysis: mlResponse.text_analysis,
        sentiment_analysis: mlResponse.sentiment_analysis,
        voice_analysis: mlResponse.voice_analysis,
        acoustic_features: acousticFeatures,
        fusion: {
          label: "Reflection Analyzed",
          message: fusionMessage
        },
        trend: {
          status: "Building trend from your reflections"
        }
      });
    }

    // Case 2: Typed text reflection
    if (rawText && rawText.trim()) {
      const text = rawText.trim();
      let mlResponse;

      try {
        const pyRes = await axios.post(`${ML_SERVICE_URL}/analyze-text`, {
          text,
          language: req.body.language || 'auto',
        }, { timeout: 60000 });
        mlResponse = pyRes.data;
      } catch (pyErr) {
        console.error("Python ML Service error during text analysis:", pyErr.message);
        return res.status(pyErr.response?.status || 503).json({
          error: mlUnavailableMessage(pyErr),
          code: pyErr.code === 'ECONNREFUSED' || pyErr.code === 'ENOTFOUND' ? 'ML_UNAVAILABLE' : 'ML_ERROR',
          service: 'ml_service',
        });
      }

      const emotion = mlResponse.text_analysis?.emotion || 'neutral';
      const sentiment = mlResponse.sentiment_analysis?.sentiment || '';

      const reflection = await Reflection.create({
        userId,
        type: 'text',
        content: text,
        transcript: text,
      });

      const resultId = `result_${Date.now()}`;
      await AnalysisResult.create({
        reflectionId: reflection._id,
        userId,
        analysisType: 'text',
        emotionCategory: emotion,
        confidenceScore: mlResponse.text_analysis?.confidence || 0.0,
        sentimentCategory: sentiment,
        sentimentScore: mlResponse.sentiment_analysis?.confidence || 0.0,
        original_text: mlResponse.original_text || text,
        english_text: mlResponse.english_text || text,
        detected_language: mlResponse.detected_language || req.body.language || 'auto',
        themeTags: [emotion],
        acousticFeatures: {
          pitchVariation: 0.0,
          energy: 0.0,
          pauseDuration: 0.0,
        },
        deviationScore: 0.0,
        resultId,
      });

      return res.status(201).json({
        transcript: text,
        original_text: mlResponse.original_text || text,
        english_text: mlResponse.english_text || text,
        detected_language: mlResponse.detected_language || req.body.language || 'auto',
        language_probability: mlResponse.language_probability,
        emotion: mlResponse.emotion || emotion,
        emotion_confidence: mlResponse.emotion_confidence ?? mlResponse.text_analysis?.confidence ?? 0,
        sentiment: mlResponse.sentiment || sentiment,
        sentiment_confidence: mlResponse.sentiment_confidence ?? mlResponse.sentiment_analysis?.confidence ?? 0,
        text_analysis: mlResponse.text_analysis,
        sentiment_analysis: mlResponse.sentiment_analysis,
        voice_analysis: {
          features_extracted: false,
          model_status: 'text_input',
          deviation_score: 0.0,
          message: 'Text reflection analyzed.'
        },
        acoustic_features: {
          pitchVariation: 0.0,
          energy: 0.0,
          pauseDuration: 0.0,
        },
        fusion: {
          label: "Text Reflection Analyzed",
          message: `Detected sentiment: ${sentiment} (${Math.round((mlResponse.sentiment_analysis?.confidence || 0) * 100)}%). Emotion: ${emotion}.`
        },
        trend: {
          status: "Building trend from your reflections"
        }
      });
    }

    return res.status(400).json({ error: 'Audio file or text content is required.' });

  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    // Only the signed-in user's own reflections.
    const reflections = await Reflection.find({ userId: req.activityUserId }).sort({ createdAt: -1 }).lean();
    
    const reflectionsWithAnalysis = await Promise.all(
      reflections.map(async (ref) => {
        const analysis = await AnalysisResult.findOne({ reflectionId: ref._id }).lean();
        
        return {
          ...ref,
          emotion: analysis?.emotionCategory || 'neutral',
          emotionConfidence: analysis?.confidenceScore || 0.5,
          sentiment: analysis?.sentimentCategory || null,
          sentimentConfidence: analysis?.sentimentScore || 0.0,
          original_text: analysis?.original_text || ref.transcript,
          english_text: analysis?.english_text || ref.transcript,
          detected_language: analysis?.detected_language || '',
          pitchVariation: analysis?.acousticFeatures?.pitchVariation || 0.5,
          energy: analysis?.acousticFeatures?.energy || 0.5,
          pauseDuration: analysis?.acousticFeatures?.pauseDuration || 0.5,
          voiceDeviation: 'moderate',
          fusionResult: 'stable'
        };
      })
    );

    res.json(reflectionsWithAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
