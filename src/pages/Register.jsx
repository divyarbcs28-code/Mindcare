import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, User, Shield, Phone, Heart, Check, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import AuthShell from '../components/shared/AuthShell';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const PREFERENCE_OPTIONS = [
  { id: 'relaxation', label: 'Relaxation', emoji: '🧘' },
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'games', label: 'Games', emoji: '🎮' },
  { id: 'journaling', label: 'Journaling', emoji: '✍️' },
  { id: 'breathing', label: 'Breathing exercises', emoji: '💨' },
  { id: 'social', label: 'Social activities', emoji: '👥' },
];

export default function Register({ onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null); // Added error state for API

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dob: '',
    gender: '',
    privacyConsent: false,
    // Step 2
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    // Step 3
    preferences: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const togglePreference = (id) => {
    setFormData(prev => {
      if (prev.preferences.includes(id)) {
        return { ...prev, preferences: prev.preferences.filter(p => p !== id) };
      }
      return { ...prev, preferences: [...prev.preferences, id] };
    });
  };

  const validateStep1 = () => {
    return formData.firstName && formData.email && formData.password && formData.dob && formData.privacyConsent;
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    try {
      // 1. Prepare data matching the Node.js backend expectation
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password, // Will be hashed by backend
        dob: formData.dob,
        gender: formData.gender,
        privacyPreferences: {
          analytics: formData.privacyConsent,
          personalization: formData.privacyConsent,
          emergencyAccess: !!formData.emergencyName
        },
        // Passing these extra fields so you can update backend routes later if needed
        emergencyContact: formData.emergencyName ? {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relation: formData.emergencyRelation
        } : null,
        preferences: formData.preferences,
      };

      // 2. Call the real MongoDB Backend
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // e.g. "User already exists."
        throw new Error(data.error || 'Failed to register account.');
      }

      // 3. Complete! Send the returned user object to App.jsx state
      onComplete({ ...data.user, token: data.token });
      navigate('/', { replace: true });
      
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/time-morning.webp"
      quote="Every sunrise is a fresh start. Let's set up your space."
      quoteBy="Three quick steps — it takes about a minute."
      maxWidth={540}
    >
      <div className="modal" style={{ width: '100%', maxWidth: 540, padding: 0, overflow: 'hidden', animation: 'none' }}>
        
        {/* Header / Progress */}
        <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={20} color="white" />
              </div>
              <span className="font-display" style={{ fontWeight: 800, fontSize: '1.2rem' }}>MindCare</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Step {step} of 3</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 3) * 100}%`, background: 'var(--gradient-primary)' }} />
          </div>
        </div>

        {/* Form Content */}
        <div style={{ padding: 32 }}>
          {step === 1 && (
            <div className="animate-fade-in-scale">
              <h2 className="font-display" style={{ marginBottom: 6, fontSize: '1.4rem' }}>Create your account</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>Let's start with your basic information.</p>
              
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>First Name *</label>
                  <input className="input" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Required" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Last Name</label>
                  <input className="input" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Optional" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Email *</label>
                <input className="input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Password *</label>
                <input className="input" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 characters" />
              </div>

              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Date of Birth *</label>
                  <input className="input" type="date" name="dob" value={formData.dob} onChange={handleChange} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Gender (Optional)</label>
                  <select className="input" name="gender" value={formData.gender} onChange={handleChange} style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                    <option value="">Select...</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(124,92,191,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,92,191,0.2)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <input type="checkbox" id="privacy" name="privacyConsent" checked={formData.privacyConsent} onChange={handleChange} style={{ marginTop: 4, cursor: 'pointer' }} />
                <label htmlFor="privacy" style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  I agree to the <strong style={{ color: 'var(--color-primary-light)' }}>Privacy & Data Use Policy</strong>. My voice and text data will be processed locally and securely for personal reflection tracking. *
                </label>
              </div>

              <button className="btn btn-primary w-full" style={{ marginTop: 24 }} disabled={!validateStep1()} onClick={handleNext}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-scale">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <Shield size={24} color="var(--color-accent)" />
                <h2 className="font-display" style={{ margin: 0, fontSize: '1.4rem' }}>Emergency Contact</h2>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>This is entirely optional, but highly recommended so we can suggest reaching out if you are in distress.</p>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Contact Name</label>
                <input className="input" type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} placeholder="e.g. Jane Doe" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Phone Number</label>
                <input className="input" type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} placeholder="+1 234 567 8900" />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Relationship to you</label>
                <input className="input" type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} placeholder="e.g. Mother, Friend, Partner" />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={handleBack} style={{ padding: '12px 16px' }}><ArrowLeft size={16} /></button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleNext}>
                  {formData.emergencyName ? 'Save & Continue' : 'Skip this step'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-scale">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <Heart size={24} color="var(--color-warning)" />
                <h2 className="font-display" style={{ margin: 0, fontSize: '1.4rem' }}>Your Preferences</h2>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>Select the types of activities you enjoy. We'll use this to tailor your support recommendations.</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
                {PREFERENCE_OPTIONS.map((pref) => {
                  const isSelected = formData.preferences.includes(pref.id);
                  return (
                    <button
                      key={pref.id}
                      onClick={() => togglePreference(pref.id)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isSelected ? 'rgba(124,92,191,0.5)' : 'var(--color-border)'}`,
                        background: isSelected ? 'rgba(124,92,191,0.15)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{pref.emoji}</span> {pref.label}
                    </button>
                  );
                })}
              </div>

              {/* Error Message Display */}
              {errorMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(231,111,81,0.1)', border: '1px solid rgba(231,111,81,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={handleBack} disabled={loading} style={{ padding: '12px 16px' }}><ArrowLeft size={16} /></button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Check size={16} /> Complete Setup</>}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 8 }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-light)', fontWeight: 600, fontSize: '0.875rem', padding: 0 }}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
