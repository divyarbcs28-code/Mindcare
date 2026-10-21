import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5003';
const moods = ['sad', 'stressed', 'angry', 'anxious', 'happy', 'calm', 'bored'];
const card = { padding: 20, marginBottom: 14 };
const labelStyle = { fontSize: '0.75rem', color: 'var(--color-text-muted)' };

function timeAgo(date) {
  const minutes = Math.round((Date.now() - new Date(date)) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

export default function WellnessActivities({ onMoodChange }) {
  const [user] = useLocalStorage('mindcare_user_data', null);
  const [mood, setMood] = useState('');
  const [detected, setDetected] = useState(null); // mood derived from the latest reflection, if any
  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState(null);
  const [current, setCurrent] = useState(null);
  const [answer, setAnswer] = useState('');
  const [gameOpened, setGameOpened] = useState([]);
  const [gameMatched, setGameMatched] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(async (path, options = {}) => {
    if (!user?.token) throw new Error('Please sign out and sign in again to enable secure activity progress.');
    const response = await fetch(`${API}/api/activities${path}`, { ...options, headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not save activity progress.');
    return data;
  }, [user]);

  const loadProgress = useCallback(async () => {
    try { setProgress(await request('/progress')); setError(''); }
    catch (err) { setError(err.message); }
  }, [request]);

  useEffect(() => { loadProgress(); }, [loadProgress]);
  useEffect(() => {
    if (!current || !breathing) return undefined;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [current, breathing]);

  const chooseMood = async (value) => {
    setMood(value); setError(''); setNotice('');
    onMoodChange?.(value);
    try { const data = await request(`/recommendations?mood=${encodeURIComponent(value)}`); setActivities(data.activities); await loadProgress(); }
    catch (err) { setError(err.message); setActivities([]); }
  };

  // Start from the mood of the latest reflection (or ?mood= from the reflection result page).
  useEffect(() => {
    const urlMood = new URLSearchParams(window.location.search).get('mood');
    (async () => {
      let latest = null;
      try { latest = await request('/current-mood'); } catch { /* no session or backend offline: manual choice still works */ }
      if (latest?.mood) setDetected(latest);
      const initial = moods.includes(urlMood) ? urlMood : latest?.mood;
      if (moods.includes(initial)) chooseMood(initial);
    })();
  }, []);

  const perform = async (activity, action) => {
    setBusy(true); setError('');
    try {
      const data = await request('/progress', { method: 'POST', body: JSON.stringify({ activityId: activity.id, mood: mood || activity.moods[0], action, durationMinutes: Math.max(0, Math.round(seconds / 6) / 10) }) });
      await loadProgress();
      if (action === 'start') { setCurrent(activity); setSeconds(0); setAnswer(''); setBreathing(false); setGameOpened([]); setGameMatched([]); setNotice(''); }
      if (action === 'complete') { setCurrent(null); setBreathing(false); setNotice(data.newBadges?.length ? `🎉 Badge earned: ${data.newBadges.map((badge) => badge.title).join(', ')}` : 'Activity completed. Nice work showing up for yourself.'); }
      if (action === 'skip') { setNotice('Skipped. There is no penalty for choosing what works for you.'); }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const counts = progress?.counts || {};
  const playerDone = current?.type === 'journaling' || current?.type === 'reflection' ? answer.trim().length > 0
    : current?.type === 'game' ? answer === 'won'
      : current?.type === 'breathing' || current?.type === 'mindfulness' ? seconds >= 10 : seconds >= 5;

  return <section style={{ marginBottom: 28 }}>
    <div className="page-header" style={{ marginTop: 12 }}>
      <h2 className="font-display gradient-text">Wellness Activities</h2>
      <p className="page-subtitle">Optional, gentle activities to explore at your own pace.</p>
    </div>
    <div className="glass-card" style={card}>
      <h3 className="font-display" style={{ fontSize: '1rem' }}>Recommended For You</h3>
      {detected ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          Your latest reflection ({timeAgo(detected.detectedAt)}) showed <strong style={{ color: 'var(--color-primary-light)' }}>{detected.emotion}</strong>
          {detected.sentiment && <> with a {detected.sentiment.toLowerCase()} tone</>}, which suggests you are feeling <strong style={{ color: 'var(--color-accent)' }}>{detected.mood}</strong>.
          {mood === detected.mood ? ' Activities below are picked for that. Feeling different now? Choose another mood.' : ` You chose ${mood || 'another mood'} instead.`}
        </p>
      ) : (
        <p style={{ ...labelStyle, marginBottom: 10 }}>No reflection in the last 24 hours. Record a reflection to get suggestions for your current mood, or choose how you feel right now.</p>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {moods.map((item) => <button key={item} type="button" className={`btn ${mood === item ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => chooseMood(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>
    </div>
    {error && <p role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    {notice && <p role="status" className="glass-card" style={{ padding: 12, color: 'var(--color-accent)' }}>{notice}</p>}

    {current && <div className="glass-card" style={{ ...card, borderColor: 'rgba(94,207,177,0.4)' }}>
      <p style={labelStyle}>IN PROGRESS · {current.durationMinutes} min suggested</p>
      <h3>{current.icon} {current.title}</h3>
      {current.instructions.map((line, i) => <p key={i} style={{ color: 'var(--color-text-secondary)' }}>{line}</p>)}
      {current.type === 'breathing' && <div style={{ textAlign: 'center', padding: 12 }}><p style={{ fontSize: '1.4rem' }}>{Math.floor(seconds / 10) % 2 === 0 ? 'Breathe in gently' : 'Breathe out slowly'}</p><p>{seconds}s</p><button type="button" className="btn btn-secondary" onClick={() => setBreathing(!breathing)}>{breathing ? 'Pause guidance' : 'Start guidance'}</button></div>}
      {current.type === 'game' && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['🌟', '🎵', '🌟', '🎵'].map((emoji, i) => <button key={i} type="button" aria-label={`Reveal card ${i + 1}`} disabled={gameMatched.includes(i) || gameOpened.includes(i)} onClick={() => { const next = [...gameOpened, i]; setGameOpened(next); if (next.length === 2) { if (['🌟', '🎵', '🌟', '🎵'][next[0]] === ['🌟', '🎵', '🌟', '🎵'][next[1]]) { const matched = [...gameMatched, ...next]; setGameMatched(matched); if (matched.length === 4) setAnswer('won'); } window.setTimeout(() => setGameOpened([]), 500); } }} style={{ padding: 16, fontSize: 24 }}>{gameMatched.includes(i) || gameOpened.includes(i) ? emoji : '?'}</button>)}<p style={{ width: '100%' }}>Match both pairs to finish this tiny game.</p></div>}
      {(current.type === 'journaling' || current.type === 'reflection') && <textarea className="input" aria-label="Optional reflection" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write only what you feel comfortable sharing. This text is not saved in your activity history." style={{ width: '100%', boxSizing: 'border-box' }} />}
      {current.resourceUrl && <a href={current.resourceUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" onClick={() => setSeconds((s) => Math.max(s, 5))}>Open sound resource ↗</a>}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}><button type="button" className="btn btn-primary" disabled={busy || !playerDone} onClick={() => perform(current, 'complete')}>Complete activity</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => { perform(current, 'skip'); setCurrent(null); }}>Skip</button><span style={labelStyle}>Elapsed: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span></div>
    </div>}

    {!current && activities.map((activity) => <div key={activity.id} className="glass-card" style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><h3 style={{ marginBottom: 4 }}>{activity.icon} {activity.title}</h3><p style={{ margin: '0 0 8px' }}>{activity.description}</p><span style={labelStyle}>{activity.type} · {activity.durationMinutes} min</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => perform(activity, 'start')}>Start Activity</button><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => perform(activity, 'skip')}>Skip</button></div></div>
    </div>)}

    <div className="glass-card" style={card}>
      <h3 className="font-display" style={{ fontSize: '1rem' }}>Activity Progress</h3>
      <p>Recommended {counts.recommended || 0} · Started {counts.started || 0} · Completed {counts.completed || 0} · Skipped {counts.skipped || 0}</p>
      <p>Total completed: {counts.totalCompleted || 0} · Completion: {counts.completionPercentage || 0}%</p>
      <h4>My Badges</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>{(progress?.badges || []).map((badge) => <div key={badge.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--color-border)', opacity: badge.earned ? 1 : 0.65 }}><strong>{badge.earned ? '🏅' : '🔒'} {badge.title}</strong><p style={{ ...labelStyle, marginBottom: 4 }}>{badge.description}</p><small>{badge.earned ? `Unlocked ${new Date(badge.unlockedAt).toLocaleDateString()}` : `Progress ${badge.progress}/${badge.target}`}</small></div>)}</div>
      <h4 style={{ marginTop: 18 }}>Recent Activity</h4>
      {(progress?.history || []).slice(0, 5).map((item) => <p key={item._id} style={{ margin: '6px 0', fontSize: '0.85rem' }}>{item.activity?.title || item.activityId} · <strong>{item.status.replace('_', ' ')}</strong> · {new Date(item.updatedAt).toLocaleDateString()}</p>)}
      {!progress?.history?.length && <p style={labelStyle}>Your activity history will appear here.</p>}
    </div>
  </section>;
}
