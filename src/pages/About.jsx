import { ExternalLink, Phone, Heart, Shield, Brain, Users, Mic, Zap, Link } from 'lucide-react';

const crisisResources = [
  { name: 'iCall India', contact: '9152987821', type: 'Phone', desc: 'Psychosocial support helpline by TISS' },
  { name: 'Vandrevala Foundation', contact: '1860-2662-345', type: 'Phone (24/7)', desc: 'Free mental health helpline' },
  { name: 'AASRA', contact: '9820466627', type: 'Phone', desc: 'Crisis intervention' },
  { name: 'iCall (Chat)', contact: 'icallhelpline.org', type: 'Website', desc: 'Email & chat counselling' },
];

const techContributions = [
  { icon: Mic, title: 'Personal Acoustic Baseline', desc: 'Your voice is compared against your own first 3–5 recordings, not a population model. This makes detection personal.' },
  { icon: Brain, title: 'Bimodal Signal Analysis', desc: 'We track both what you say (NLP text) and how you sound (acoustic features) — two separate signals that together give a fuller picture.' },
  { icon: Zap, title: 'Explainable Fusion', desc: 'A transparent rule-based fusion system combines both signals. No opaque ML score. Every output can be explained.' },
  { icon: Link, title: 'Longitudinal Trend', desc: 'Your pattern is compared across time. A single unusual reading is flagged differently than 3 consecutive changes.' },
];

export default function About() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title gradient-text">About & Safety</h1>
        <p className="page-subtitle">Understanding MindCare — what it is, what it is not, and where to get real help.</p>
      </div>

      {/* Safety Card — most important, shown first */}
      <div className="glass-card" style={{
        padding: 28,
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(231,111,81,0.1) 0%, rgba(231,111,81,0.04) 100%)',
        borderColor: 'rgba(231,111,81,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(231,111,81,0.15)', border: '1px solid rgba(231,111,81,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={20} color="var(--color-danger)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-danger)' }}>🆘 If you need immediate help</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Real support from trained professionals — not an AI</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {crisisResources.map((r, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 2px', fontSize: '0.9rem' }}>{r.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>{r.desc}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-danger)', margin: '0 0 2px', fontSize: '0.95rem' }}>{r.contact}</p>
                <span className="badge badge-significant" style={{ fontSize: '0.68rem' }}>{r.type}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(231,111,81,0.07)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', lineHeight: 1.65 }}>
          ⚠️ <strong style={{ color: 'var(--color-text-primary)' }}>MindCare is not a crisis service.</strong> If you are experiencing thoughts of self-harm, please contact one of the above resources immediately. These are staffed by trained mental-health professionals.
        </div>
      </div>

      {/* What MindCare is */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,191,0.15)', border: '1px solid rgba(124,92,191,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="var(--color-primary-light)" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>What MindCare is — and isn't</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: 'rgba(94,207,177,0.07)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(94,207,177,0.2)' }}>
            <p style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: 10, fontSize: '0.875rem' }}>✅ What it IS</p>
            {[
              'A personal pattern tracker',
              'Voice + text reflection tool',
              'Longitudinal trend monitor',
              'Supportive activity guide',
              'Private and local-first',
            ].map((t, i) => <p key={i} style={{ fontSize: '0.8rem', margin: '4px 0', lineHeight: 1.5 }}>• {t}</p>)}
          </div>
          <div style={{ padding: 16, background: 'rgba(231,111,81,0.07)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(231,111,81,0.2)' }}>
            <p style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: 10, fontSize: '0.875rem' }}>❌ What it is NOT</p>
            {[
              'A diagnostic tool',
              'A medical service',
              'A replacement for therapy',
              'A population-model classifier',
              'A crisis intervention service',
            ].map((t, i) => <p key={i} style={{ fontSize: '0.8rem', margin: '4px 0', lineHeight: 1.5 }}>• {t}</p>)}
          </div>
        </div>
      </div>

      {/* Technical Contributions */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(94,207,177,0.12)', border: '1px solid rgba(94,207,177,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="var(--color-accent)" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Technical Contributions</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {techContributions.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,92,191,0.12)', border: '1px solid rgba(124,92,191,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color="var(--color-primary-light)" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)', margin: '0 0 3px' }}>{title}</p>
                <p style={{ fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Architecture */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 18 }}>System Architecture</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: 'Voice Recording', sub: 'Browser MediaRecorder API', icon: '🎙️' },
            { step: 'Speech-to-Text', sub: 'Whisper / Google STT (backend)', icon: '📝' },
            { step: 'Text Analysis (NLP)', sub: 'DistilBERT emotion classifier', icon: '🧠' },
            { step: 'Acoustic Analysis', sub: 'Librosa → MFCC, Pitch, Energy, ZCR + XGBoost', icon: '📊' },
            { step: 'Personal Baseline', sub: 'First 3–5 entries form your own reference', icon: '📏' },
            { step: 'Explainable Fusion', sub: 'Rule-based combination of both signals', icon: '🔗' },
            { step: 'Insight + History', sub: 'SQLite, trend chart, longitudinal comparison', icon: '📈' },
          ].map(({ step, sub, icon }, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>
                  {icon}
                </div>
                {i < arr.length - 1 && <div style={{ width: 2, height: 24, background: 'rgba(124,92,191,0.25)', margin: '4px 0' }} />}
              </div>
              <div style={{ paddingTop: 6, paddingBottom: i < arr.length - 1 ? 12 : 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', margin: '0 0 2px' }}>{step}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About the project */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,191,0.12)', border: '1px solid rgba(124,92,191,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="var(--color-primary-light)" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>About This Project</h3>
        </div>
        <p style={{ lineHeight: 1.75, marginBottom: 16, fontSize: '0.875rem' }}>
          MindCare is a student mini-project developed as part of a 5th semester computer science program. It explores the intersection of voice technology, natural language processing, and mental wellness — without attempting clinical diagnosis.
        </p>
        <p style={{ lineHeight: 1.75, marginBottom: 16, fontSize: '0.875rem' }}>
          The technical novelty lies in its <strong style={{ color: 'var(--color-text-primary)' }}>personal baseline approach</strong>: comparing your voice and expression against your own previous recordings rather than a generalised population model.
        </p>
        <div style={{ padding: '14px 18px', background: 'rgba(124,92,191,0.07)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,92,191,0.2)', fontSize: '0.83rem', fontStyle: 'italic', lineHeight: 1.7 }}>
          "MindCare is not positioned as a diagnostic system. Its technical contribution is a personal-baseline, multimodal reflection pipeline that combines what a user says with selected acoustic characteristics of how they speak."
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['React + Vite', 'FastAPI', 'Python', 'Librosa', 'XGBoost', 'SQLite', 'DistilBERT'].map(t => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
