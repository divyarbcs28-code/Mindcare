import { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Send, Play, Pause, CheckCircle, Info, Edit3 } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import AnimatedRing from '../components/shared/AnimatedRing';
import { EmotionBadge, FusionBadge, SentimentBadge } from '../components/shared/EmotionBadge';
import { blobToWav } from '../utils/audioConverter';

// Reflections are English-only: the emotion and sentiment models are English models.
const REFLECTION_LANGUAGE = 'en';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
// Must exceed the Node->ML audio timeout (120 s) so the server's specific error wins over a generic abort.
const TRANSCRIBE_CLIENT_TIMEOUT_MS = 135000;
const TEXT_CLIENT_TIMEOUT_MS = 75000;

const NEGATIVE_EMOTIONS = ['sadness', 'anger', 'fear', 'disgust'];

/** Activity mood for an analysis result. Same mapping as the backend's /api/activities/current-mood. */
function moodFromResult(emotion, sentiment, text = '') {
  const negative = String(sentiment || '').toUpperCase() === 'NEGATIVE';
  // The emotion model has no "bored" label, so boredom is recognised from the words used.
  if (/\b(bored|boring|boredom|nothing to do)\b/i.test(text) && !['anger', 'fear'].includes(String(emotion || '').toLowerCase())) return 'bored';
  return { sadness: 'sad', anger: 'angry', disgust: 'angry', fear: 'anxious', joy: 'happy', surprise: negative ? 'anxious' : 'happy' }[String(emotion || '').toLowerCase()]
    || (negative ? 'stressed' : 'calm');
}

// One Fun Zone activity per mood, matching the backend activity catalog.
const MOOD_SUGGESTIONS = {
  sad: { label: 'Three Good Things', emoji: '📝' },
  stressed: { label: 'Steady Breathing', emoji: '🌬️' },
  anxious: { label: 'Notice Your Surroundings', emoji: '🌿' },
  angry: { label: 'Steady Breathing', emoji: '🌬️' },
  happy: { label: 'A Bright Moment', emoji: '✨' },
  calm: { label: 'Mindful Pause', emoji: '🧘' },
  bored: { label: 'Simon Says & more games', emoji: '🎶' },
};

function suggestionFor(emotion, sentiment, text) {
  const mood = moodFromResult(emotion, sentiment, text);
  return { ...MOOD_SUGGESTIONS[mood], mood, to: `/funzone?mood=${mood}` };
}

/** Stable when emotion and sentiment are both non-negative; a stronger signal when both are negative. */
function fusionFor(emotion, sentiment) {
  const negativeEmotion = NEGATIVE_EMOTIONS.includes(String(emotion || '').toLowerCase());
  const negativeSentiment = String(sentiment || '').toUpperCase() === 'NEGATIVE';
  if (negativeEmotion && negativeSentiment) return 'significant_change';
  if (negativeEmotion || negativeSentiment) return 'expression_change';
  return 'stable';
}

const WARNING_TEXT = {
  very_short_recording: 'This was a very short recording, so the transcript may be incomplete.',
};

/** fetch with a hard timeout; a timeout becomes a clear, retryable error instead of a hang. */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error(`No answer from the server after ${Math.round(timeoutMs / 1000)}s. Your recording is kept - please try again, or use a shorter recording.`);
      timeout.retryable = true;
      throw timeout;
    }
    const network = new Error('Could not reach the MindCare server. Check that the Node (port 5003) and ML (port 8000) services are running, then retry. Your recording is kept.');
    network.retryable = true;
    throw network;
  } finally {
    clearTimeout(timer);
  }
}

/** Parse an error response from the Node API: {error, code, retryable}. */
async function readApiError(response, fallback) {
  const body = await response.json().catch(() => ({}));
  const err = new Error(body.error || fallback);
  err.code = body.code;
  err.retryable = body.retryable !== false;
  return err;
}

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VoiceReflection() {
  const { isRecording, audioBlob, audioUrl, duration, error, setError, startRecording, stopRecording, reset } = useAudioRecorder();
  const [inputMode, setInputMode] = useState('voice'); // voice | text
  const [typedText, setTypedText] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | recording | recorded | analysing | result
  const [result, setResult] = useState(null);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  // Response of POST /api/reflections/transcribe (transcription + acoustic + audio info). Nothing is saved yet.
  const [pendingVoiceAnalysis, setPendingVoiceAnalysis] = useState(null);
  const [transcribeProblem, setTranscribeProblem] = useState(null); // {message, retryable} when ASR did not produce text
  const [isConfirmingTranscript, setIsConfirmingTranscript] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const requestInFlight = useRef(false); // blocks duplicate submissions even before React re-renders

  const handleStart = async () => {
    setError(null);
    await startRecording();
    setPhase('recording');
  };

  const handleStop = () => {
    stopRecording();
    setPhase('recorded');
  };

  const handleReset = () => {
    reset();
    setError(null);
    setResult(null);
    setTranscriptDraft('');
    setPendingVoiceAnalysis(null);
    setTranscribeProblem(null);
    requestInFlight.current = false;
    setPhase('idle');
    setIsPlaying(false);
    setTypedText('');
  };

  // Go back to the playback screen with the SAME recording to retry.
  const handleRetryTranscription = () => {
    setError(null);
    setTranscribeProblem(null);
    setPendingVoiceAnalysis(null);
    setTranscriptDraft('');
    setPhase('recorded');
  };

  const getUserId = () => {
    const userStr = localStorage.getItem('mindcare_user_data');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        return userObj._id || '64f1a2b3c4d5e6f7a8b9c0d1';
      } catch {
        return '64f1a2b3c4d5e6f7a8b9c0d1';
      }
    }
    return '64f1a2b3c4d5e6f7a8b9c0d1';
  };

  // Step 1: speech-to-text + acoustic features only. Nothing is analysed or saved until the user confirms the transcript.
  const handleAnalyse = async () => {
    if (requestInFlight.current) return;
    if (!audioBlob) {
      setError('No audio recorded.');
      return;
    }
    requestInFlight.current = true;
    setError(null);
    setTranscribeProblem(null);
    setPhase('analysing');

    try {
      // Browser-side WAV conversion is an optimisation only; the server decodes WebM/Opus/MP4 itself.
      let uploadBlob = audioBlob;
      let uploadName = 'reflection.webm';
      try {
        uploadBlob = await blobToWav(audioBlob);
        uploadName = 'reflection.wav';
      } catch (convErr) {
        console.warn('Browser WAV conversion failed; uploading the original recording.', convErr.message);
      }

      const formData = new FormData();
      formData.append('language', REFLECTION_LANGUAGE);
      formData.append('audio', uploadBlob, uploadName);

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/reflections/transcribe`, {
        method: 'POST',
        body: formData,
      }, TRANSCRIBE_CLIENT_TIMEOUT_MS);
      if (!response.ok) throw await readApiError(response, 'Transcription failed.');

      const data = await response.json();
      const transcription = data.transcription || {};
      setPendingVoiceAnalysis(data);

      if (transcription.status === 'ok' && transcription.text) {
        setTranscriptDraft(transcription.text);
      } else {
        // Honest failure: no fake transcript. Acoustic analysis already ran, so the user may type what they said.
        setTranscriptDraft('');
        setTranscribeProblem({
          message: transcription.error?.message || 'Speech could not be transcribed.',
          retryable: transcription.error?.retryable !== false,
        });
      }
      setPhase('review');
    } catch (err) {
      console.error('Transcription request failed:', err.code || err.message);
      setError(err.message || 'Transcription failed. Please try again.');
      setPhase('recorded'); // recording is kept so the user can retry without re-recording
    } finally {
      requestInFlight.current = false;
    }
  };

  // Step 2: analyse the confirmed (possibly edited or typed) transcript, then save.
  const handleConfirmTranscript = async () => {
    if (requestInFlight.current) return;
    if (!transcriptDraft.trim() || !pendingVoiceAnalysis) {
      setError('Please review the transcript before continuing.');
      return;
    }

    requestInFlight.current = true;
    setError(null);
    setIsConfirmingTranscript(true);
    try {
      const transcription = pendingVoiceAnalysis.transcription || {};
      const asrText = (transcription.text || '').trim();
      const draft = transcriptDraft.trim();
      const source = transcription.status !== 'ok' || !asrText ? 'manual' : draft === asrText ? 'asr' : 'asr_edited';
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/reflections/confirm-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          transcript: draft,
          language: REFLECTION_LANGUAGE,
          language_probability: transcription.language_probability ?? null,
          acousticFeatures: {
            pitchVariation: pendingVoiceAnalysis.acoustic_features?.pitch_variation,
            energy: pendingVoiceAnalysis.acoustic_features?.energy,
            pauseDuration: pendingVoiceAnalysis.acoustic_features?.pause_duration,
          },
          voiceAnalysis: pendingVoiceAnalysis.voice_analysis,
          transcription: {
            source,
            status: transcription.status,
            language_source: transcription.language_source,
            model: transcription.model,
            processing_time_ms: transcription.processing_time_ms,
            duration_seconds: pendingVoiceAnalysis.audio?.duration_seconds,
          },
        }),
      }, TEXT_CLIENT_TIMEOUT_MS);
      if (!response.ok) throw await readApiError(response, 'Failed to analyze the reviewed transcript.');
      const data = await response.json();

      setResult({
        transcript: data.original_text || data.transcript,
        emotion: data.text_analysis?.emotion || 'neutral',
        emotionConfidence: Number(data.text_analysis?.confidence || 0),
        sentiment: data.sentiment_analysis?.sentiment || null,
        sentimentConfidence: Number(data.sentiment_analysis?.confidence || 0),
        themes: [data.text_analysis?.emotion || 'general'],
        voiceDeviation: data.voice_analysis?.deviation_score ? 'moderate' : 'pending',
        pitchVariation: Number(data.acoustic_features?.pitchVariation ?? data.acoustic_features?.pitch_variation ?? 0),
        energy: Number(data.acoustic_features?.energy ?? 0),
        pauseDuration: Number(data.acoustic_features?.pauseDuration ?? data.acoustic_features?.pause_duration ?? 0),
        fusionResult: fusionFor(data.text_analysis?.emotion, data.sentiment_analysis?.sentiment),
        fusionNote: data.fusion?.message || 'Analyzed.',
        suggestedActivity: suggestionFor(data.text_analysis?.emotion, data.sentiment_analysis?.sentiment, data.original_text || data.transcript),
        voiceModelStatus: data.voice_analysis?.model_status || 'not_trained',
        type: 'voice',
      });
      setPhase('result');
    } catch (err) {
      console.error('Transcript analysis failed:', err.code || err.message);
      setError(err.message || 'Failed to analyze the reviewed transcript.'); // stays on the review screen; the draft is kept
    } finally {
      requestInFlight.current = false;
      setIsConfirmingTranscript(false);
    }
  };

  const handleAnalyseText = async () => {
    if (!typedText.trim()) {
      setError('Please enter some text for your reflection.');
      return;
    }

    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setError(null);
    setPhase('analysing');

    try {
      const userId = getUserId();

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/reflections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'text',
          content: typedText.trim(),
          language: REFLECTION_LANGUAGE,
        }),
      }, TEXT_CLIENT_TIMEOUT_MS);

      if (!response.ok) throw await readApiError(response, 'Failed to analyse text reflection.');

      const data = await response.json();

      const transformedResult = {
        transcript: data.original_text || data.transcript,
        emotion: data.text_analysis?.emotion || 'neutral',
        emotionConfidence: Number(data.text_analysis?.confidence || 0),
        sentiment: data.sentiment_analysis?.sentiment || null,
        sentimentConfidence: Number(data.sentiment_analysis?.confidence || 0),
        themes: [data.text_analysis?.emotion || 'general'],
        voiceDeviation: 'low',
        pitchVariation: 0.0,
        energy: 0.0,
        pauseDuration: 0.0,
        fusionResult: fusionFor(data.text_analysis?.emotion, data.sentiment_analysis?.sentiment),
        fusionNote: data.fusion?.message || 'Text reflection analyzed.',
        suggestedActivity: suggestionFor(data.text_analysis?.emotion, data.sentiment_analysis?.sentiment, data.original_text || data.transcript),
        voiceModelStatus: 'text_input',
        type: 'text',
      };

      setResult(transformedResult);
      setPhase('result');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed. Make sure both Node (port 5003) and Python (port 8000) servers are running.');
      setPhase('idle');
    } finally {
      requestInFlight.current = false;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Elapsed-seconds counter while the server transcribes (CPU Whisper can take a while).
  useEffect(() => {
    if (phase !== 'analysing' || inputMode !== 'voice') return undefined;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase, inputMode]);

  // Auto-stop at 30s
  useEffect(() => {
    if (isRecording && duration >= 30) handleStop();
  }, [duration, isRecording]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title gradient-text">Reflection Studio</h1>
        <p className="page-subtitle">Reflect via voice or typed journal to track your emotions, sentiment, and patterns.</p>
      </div>

      {/* Mode Switcher */}
      {phase !== 'result' && phase !== 'analysing' && phase !== 'review' && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          <button
            type="button"
            id="tab-voice-mode"
            onClick={() => { setInputMode('voice'); setError(null); }}
            className={`btn btn-sm ${inputMode === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
          >
            <Mic size={14} style={{ marginRight: 6 }} /> Voice Recording
          </button>
          <button
            type="button"
            id="tab-text-mode"
            onClick={() => { setInputMode('text'); setError(null); }}
            className={`btn btn-sm ${inputMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
          >
            <Edit3 size={14} style={{ marginRight: 6 }} /> Typed Journal
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="glass-card" style={{
        padding: '14px 18px',
        marginBottom: 24,
        background: 'rgba(124,92,191,0.07)',
        borderColor: 'rgba(124,92,191,0.2)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <Info size={16} color="var(--color-primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.83rem', margin: 0, lineHeight: 1.6 }}>
          This is not a diagnosis. We analyse patterns in <strong style={{ color: 'var(--color-text-primary)' }}>what you say</strong> (Emotion & Sentiment) and <strong style={{ color: 'var(--color-text-primary)' }}>how you sound</strong> (Acoustics) to track personal changes over time.
        </p>
      </div>

      {/* Text Reflection Input Card */}
      {inputMode === 'text' && phase !== 'result' && (
        <div className="glass-card animate-fade-in" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
          <h3 style={{ marginBottom: 8 }}>Write Your Reflection</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
            Type freely about how you are feeling or what happened today.
          </p>
          <textarea
            id="typed-reflection-input"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type your reflection here... (e.g. 'I had a very productive day and feel grateful for my friends.')"
            rows={5}
            style={{
              width: '100%',
              maxWidth: 600,
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              resize: 'vertical',
              marginBottom: 20,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <div>
            <button
              id="btn-analyse-text"
              onClick={handleAnalyseText}
              disabled={phase === 'analysing' || !typedText.trim()}
              className="btn btn-primary"
            >
              {phase === 'analysing' ? 'Analysing Reflection…' : <><Send size={16} /> Analyse Reflection</>}
            </button>
          </div>
        </div>
      )}

      {/* Voice Reflection Card */}
      {inputMode === 'voice' && (
        <div className="glass-card" style={{ padding: 40, marginBottom: 24, textAlign: 'center' }}>

          {/* Idle */}
          {phase === 'idle' && (
            <div className="animate-fade-in-scale stagger">
              <p style={{ marginBottom: 32, color: 'var(--color-text-secondary)' }}>
                Tap the microphone to begin. Speak for at least 10 seconds.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <AnimatedRing active={false} size={100}>
                  <button
                    id="btn-start-recording"
                    onClick={handleStart}
                    className="btn btn-primary"
                    style={{ width: 100, height: 100, borderRadius: '50%', fontSize: '1.5rem' }}
                  >
                    <Mic size={36} />
                  </button>
                </AnimatedRing>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>🔒 Your recording is sent to the MindCare server for transcription and is not stored afterwards</p>
            </div>
          )}

          {/* Recording */}
          {phase === 'recording' && (
            <div className="animate-fade-in-scale">
              <div className="waveform" style={{ justifyContent: 'center', marginBottom: 28, height: 60 }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="waveform-bar" style={{ height: `${30 + Math.random() * 70}%` }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <AnimatedRing active size={100}>
                  <button
                    id="btn-stop-recording"
                    onClick={handleStop}
                    className="btn btn-danger"
                    style={{ width: 100, height: 100, borderRadius: '50%' }}
                  >
                    <Square size={28} fill="currentColor" />
                  </button>
                </AnimatedRing>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: 8, color: 'var(--color-danger)' }}>
                {formatDuration(duration)}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Recording… tap to stop {duration < 10 ? `(min ${10 - duration}s more)` : ''}
              </p>
            </div>
          )}

          {/* Recorded — awaiting analyse or analysing */}
          {(phase === 'recorded' || phase === 'analysing') && (
            <div className="animate-fade-in-scale">
              <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: 'rgba(94,207,177,0.15)',
                border: '2px solid rgba(94,207,177,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle size={32} color="var(--color-accent)" />
              </div>
              <h3 style={{ marginBottom: 6 }}>Recording Complete</h3>
              <p style={{ marginBottom: 20, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                {formatDuration(duration)} recorded
              </p>

              {/* Playback */}
              {audioUrl && (
                <div style={{ marginBottom: 24 }}>
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                  <button id="btn-playback" onClick={togglePlay} className="btn btn-secondary" style={{ marginBottom: 16 }}>
                    {isPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Play Recording</>}
                  </button>
                </div>
              )}

              {phase === 'analysing' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <div className="spinner" />
                    <span style={{ color: 'var(--color-primary-light)', fontSize: '0.9rem' }}>Transcribing your recording… {elapsed}s</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 12 }}>
                    Converting your English speech to text. You’ll be able to review and correct the transcript before it is analysed.
                    {elapsed > 20 && ' This can take up to a minute on a computer without a GPU.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button id="btn-analyse" onClick={handleAnalyse} className="btn btn-primary">
                    <Send size={16} /> Analyse Reflection
                  </button>
                  <button id="btn-re-record" onClick={handleReset} className="btn btn-secondary">
                    <RotateCcw size={16} /> Re-record
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'review' && (
            <div className="animate-fade-in-scale" style={{ textAlign: 'left', maxWidth: 680, margin: '0 auto' }}>
              <h3 style={{ marginBottom: 8 }}>{transcribeProblem ? 'We couldn’t transcribe this recording' : 'Review your transcript'}</h3>
              {transcribeProblem ? (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: 16 }}>
                  {transcribeProblem.message} Your recording is kept — you can retry, or type what you said below.
                </p>
              ) : (
                <>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 8 }}>
                    Automatic transcription can make mistakes. Edit anything that doesn’t match your recording; we’ll analyze and save the corrected text.
                  </p>
                  {(pendingVoiceAnalysis?.transcription?.warnings || []).filter((w) => WARNING_TEXT[w]).map((w) => (
                    <p key={w} style={{ color: 'var(--color-warning)', fontSize: '0.78rem', marginBottom: 8 }}>⚠️ {WARNING_TEXT[w]}</p>
                  ))}
                </>
              )}
              <textarea
                id="voice-transcript-review"
                aria-label="Review and edit your transcript"
                value={transcriptDraft}
                onChange={(event) => setTranscriptDraft(event.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  marginBottom: 18,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  id="btn-confirm-transcript"
                  onClick={handleConfirmTranscript}
                  disabled={isConfirmingTranscript || !transcriptDraft.trim()}
                  className="btn btn-primary"
                >
                  {isConfirmingTranscript ? 'Analyzing corrected transcript…' : <><CheckCircle size={16} /> Confirm & Analyze</>}
                </button>
                <button id="btn-retry-transcription" onClick={handleRetryTranscription} disabled={isConfirmingTranscript} className="btn btn-secondary">
                  <RotateCcw size={16} /> Retry transcription
                </button>
                <button id="btn-rerecord-transcript" onClick={handleReset} className="btn btn-secondary">
                  <RotateCcw size={16} /> Re-record
                </button>
              </div>
            </div>
          )}

          {/* Result Card */}
          {phase === 'result' && result && (
            <div className="animate-fade-in-scale" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="gradient-text">Analysis Result</h3>
                <button id="btn-new-reflection" onClick={handleReset} className="btn btn-secondary btn-sm">
                  <RotateCcw size={14} /> New Reflection
                </button>
              </div>

              {/* Transcript / Input text */}
              <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {result.type === 'text' ? 'Reflection Text' : 'Transcript'}
                </p>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-primary)', margin: 0 }}>
                  "{result.transcript}"
                </p>
              </div>

              {/* Model 1: Emotion Analysis (DistilRoBERTa) */}
              <div className="glass-card" style={{ padding: 18, marginBottom: 12, borderColor: 'rgba(124,92,191,0.2)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-primary-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  📝 Emotion Analysis (DistilRoBERTa)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <EmotionBadge emotion={result.emotion} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {Math.round(result.emotionConfidence * 100)}% confidence
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>Detected themes:</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {result.themes.map(t => <span key={t} className="chip">{t}</span>)}
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <div className="progress-fill" style={{
                    width: `${result.emotionConfidence * 100}%`,
                    background: 'var(--gradient-primary)'
                  }} />
                </div>
              </div>

              {/* Model 3: Sentiment Analysis (DistilBERT SST-2) - Displayed Separately */}
              {result.sentiment && (
                <div className="glass-card" style={{ padding: 18, marginBottom: 12, borderColor: 'rgba(94,207,177,0.25)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-accent)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    💬 Sentiment Analysis (DistilBERT SST-2)
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <SentimentBadge sentiment={result.sentiment} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {Math.round(result.sentimentConfidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="progress-bar" style={{ marginTop: 10 }}>
                    <div className="progress-fill" style={{
                      width: `${result.sentimentConfidence * 100}%`,
                      background: result.sentiment.toUpperCase() === 'POSITIVE'
                        ? 'linear-gradient(90deg, #5ECFB1 0%, #38b2ac 100%)'
                        : 'linear-gradient(90deg, #E76F51 0%, #dd6b20 100%)'
                    }} />
                  </div>
                </div>
              )}

              {/* Model 2: Acoustic Analysis (XGBoost) */}
              {result.type !== 'text' && (
                <div className="glass-card" style={{ padding: 18, marginBottom: 12, borderColor: 'rgba(94,207,177,0.2)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-accent)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    🎤 Acoustic Analysis (XGBoost)
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 10 }}>
                    {[
                      { label: 'Pitch variation', value: result.pitchVariation },
                      { label: 'Energy', value: result.energy },
                      { label: 'Pause duration', value: result.pauseDuration },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', margin: 0 }}>
                          {value.toFixed(2)}
                        </p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', margin: 0 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Voice model status:</span>
                    {result.voiceModelStatus === 'not_trained' ? (
                      <span className="badge" style={{ background: 'rgba(244,162,97,0.15)', color: 'var(--color-warning)' }}>
                        ⏳ Pending Training Phase
                      </span>
                    ) : (
                      <span className={`badge ${result.voiceDeviation === 'high' ? 'badge-significant' : result.voiceDeviation === 'moderate' ? 'badge-change' : 'badge-stable'}`}>
                        {result.voiceDeviation === 'high' ? '▲ High' : result.voiceDeviation === 'moderate' ? '◆ Moderate' : '● Low'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Fusion Result */}
              <div className="glass-card" style={{
                padding: 18, marginBottom: 16,
                background: 'linear-gradient(135deg, rgba(124,92,191,0.12) 0%, rgba(94,207,177,0.06) 100%)',
                borderColor: 'rgba(124,92,191,0.3)',
              }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-primary-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  🔗 Fusion Result
                </p>
                <div style={{ marginBottom: 10 }}>
                  <FusionBadge result={result.fusionResult} />
                </div>
                <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: 1.65 }}>{result.fusionNote}</p>
              </div>

              {/* Suggested Activity */}
              <div style={{ padding: '14px 18px', background: 'rgba(94,207,177,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(94,207,177,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{result.suggestedActivity.emoji}</span>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Suggested for feeling {result.suggestedActivity.mood}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent)', margin: 0 }}>{result.suggestedActivity.label}</p>
                  </div>
                </div>
                <a href={result.suggestedActivity.to} className="btn btn-accent btn-sm" id="btn-suggested-activity">Try it in Fun Zone →</a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Shared Result Card (renders for BOTH voice & text modes) ── */}
      {phase === 'result' && result && inputMode === 'text' && (
        <div className="glass-card animate-fade-in-scale" style={{ padding: 32, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="gradient-text">Analysis Result</h3>
            <button id="btn-new-reflection-text" onClick={handleReset} className="btn btn-secondary btn-sm">
              <RotateCcw size={14} /> New Reflection
            </button>
          </div>

          {/* Reflection Text */}
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Reflection Text
            </p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-primary)', margin: 0 }}>
              "{result.transcript}"
            </p>
          </div>

          {/* Emotion */}
          <div className="glass-card" style={{ padding: 18, marginBottom: 12, borderColor: 'rgba(124,92,191,0.2)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-primary-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              📝 Emotion Analysis (DistilRoBERTa)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <EmotionBadge emotion={result.emotion} />
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {Math.round(result.emotionConfidence * 100)}% confidence
              </span>
            </div>
            <div className="progress-bar" style={{ marginTop: 10 }}>
              <div className="progress-fill" style={{ width: `${result.emotionConfidence * 100}%`, background: 'var(--gradient-primary)' }} />
            </div>
          </div>

          {/* Sentiment */}
          {result.sentiment && (
            <div className="glass-card" style={{ padding: 18, marginBottom: 12, borderColor: 'rgba(94,207,177,0.25)' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-accent)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                💬 Sentiment Analysis (DistilBERT SST-2)
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <SentimentBadge sentiment={result.sentiment} />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {Math.round(result.sentimentConfidence * 100)}% confidence
                </span>
              </div>
              <div className="progress-bar" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{
                  width: `${result.sentimentConfidence * 100}%`,
                  background: result.sentiment.toUpperCase() === 'POSITIVE'
                    ? 'linear-gradient(90deg, #5ECFB1 0%, #38b2ac 100%)'
                    : 'linear-gradient(90deg, #E76F51 0%, #dd6b20 100%)'
                }} />
              </div>
            </div>
          )}

          {/* Fusion */}
          <div className="glass-card" style={{
            padding: 18, marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(124,92,191,0.12) 0%, rgba(94,207,177,0.06) 100%)',
            borderColor: 'rgba(124,92,191,0.3)',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-primary-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              🔗 Summary
            </p>
            <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: 1.65 }}>{result.fusionNote}</p>
          </div>
        </div>
      )}

      {/* Shared analysing spinner for text mode */}
      {phase === 'analysing' && inputMode === 'text' && (
        <div className="glass-card animate-fade-in" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <div className="spinner" />
            <span style={{ color: 'var(--color-primary-light)', fontSize: '0.9rem' }}>Analysing your reflection…</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {['Analysing emotion (DistilRoBERTa)…', 'Classifying sentiment (DistilBERT)…'].map((msg, i) => (
              <p key={i} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', animation: `fadeIn 0.4s ease ${i * 0.5}s both` }}>
                ✓ {msg}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(231,111,81,0.1)', border: '1px solid rgba(231,111,81,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: 20 }}>
          ⚠️ {error}
          {phase === 'recorded' && audioBlob && (
            <button type="button" onClick={handleAnalyse} className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }}>
              Retry
            </button>
          )}
        </div>
      )}

      {/* How it works */}
      {phase === 'idle' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16, fontSize: '0.95rem' }}>How it works</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: '01', label: 'Express', desc: 'Speak or type about your day and thoughts freely' },
              { step: '02', label: 'Emotion & Sentiment (NLP)', desc: 'DistilRoBERTa detects nuanced emotion, DistilBERT classifies positive/negative sentiment' },
              { step: '03', label: 'Acoustic Analysis', desc: 'XGBoost compares voice features to your personal baseline' },
              { step: '04', label: 'Fusion & Tracking', desc: 'All signals combine for personal mental wellness pattern tracking' },
            ].map(({ step, label, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: 32, height: 32,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, color: 'white',
                }}>
                  {step}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
