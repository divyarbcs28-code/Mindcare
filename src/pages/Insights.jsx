import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { mockHistory, fusionLabels, emotionLabels } from '../data/mockHistory';
import { EmotionBadge, FusionBadge, SentimentBadge } from '../components/shared/EmotionBadge';
import { fetchMoodEntries } from '../services/moodService';
import { TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import PageHero from '../components/shared/PageHero';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.8rem' }}>
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{label}</p>
      {payload.map(p => (<p key={p.dataKey} style={{ margin: '2px 0', color: p.color }}>{p.name}: {p.value}</p>))}
    </div>
  );
};

export default function Insights() {
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [activeLines, setActiveLines] = useState(['pitch', 'energy', 'pause']);
  const [history, setHistory] = useState(mockHistory);

  useEffect(() => {
    let cancelled = false;

    fetchMoodEntries().then((entries) => {
      if (!cancelled && entries.length) {
        setHistory(entries);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLine = (key) => setActiveLines(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const chartData = history.map(e => ({ date: (e.date || '').slice(5), pitch: +Number(e.pitchVariation || 0).toFixed(2), energy: +Number(e.energy || 0).toFixed(2), pause: +Number(e.pauseDuration || 0).toFixed(2) }));

  const total = history.length;
  const negCount = history.filter(e => e.emotion === 'negative').length;
  const stableCount = history.filter(e => e.fusionResult === 'stable').length;
  const avgPitch = (history.reduce((s, e) => s + (Number(e.pitchVariation) || 0), 0) / (total || 1)).toFixed(2);
  const basePitch = history.slice(0, 3).reduce((s, e) => s + (Number(e.pitchVariation) || 0), 0) / Math.max(history.slice(0, 3).length, 1);
  const recentPitch = history.slice(-3).reduce((s, e) => s + (Number(e.pitchVariation) || 0), 0) / Math.max(history.slice(-3).length, 1);
  const pitchDelta = basePitch ? (((recentPitch - basePitch) / basePitch) * 100).toFixed(0) : '0';

  const lineConfig = [
    { key: 'pitch', name: 'Pitch Variation', color: '#7C5CBF' },
    { key: 'energy', name: 'Energy', color: '#5ECFB1' },
    { key: 'pause', name: 'Pause Duration', color: '#F4A261' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHero
        image="/images/progress-road.webp"
        position="center 60%"
        eyebrow="Progress"
        title="Insights and History"
        subtitle="Your personal voice pattern trends. Compared against your own baseline, not a population average."
      />
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total entries', value: total, color: 'var(--color-primary-light)', emoji: '📋' },
          { label: 'Stable days', value: stableCount, color: 'var(--color-accent)', emoji: '✅' },
          { label: 'Noticed changes', value: negCount, color: 'var(--color-warning)', emoji: '📊' },
          { label: 'Avg pitch var.', value: avgPitch, color: 'var(--color-text-secondary)', emoji: '🎙️' },
        ].map(({ label, value, color, emoji }) => (
          <div key={label} className="glass-card animate-fade-in" style={{ padding: 16, textAlign: 'center' }}>
            <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color, margin: '6px 0 2px' }}>{value}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', marginBottom: 20, background: Math.abs(pitchDelta) > 15 ? 'rgba(244,162,97,0.08)' : 'rgba(94,207,177,0.08)', border: `1px solid ${Math.abs(pitchDelta) > 15 ? 'rgba(244,162,97,0.25)' : 'rgba(94,207,177,0.25)'}`, borderRadius: 'var(--radius-md)', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 10 }}>
        <TrendingUp size={16} color={Math.abs(pitchDelta) > 15 ? 'var(--color-warning)' : 'var(--color-accent)'} />
        <span>Your recent pitch variation is <strong style={{ color: 'var(--color-text-primary)' }}>{pitchDelta > 0 ? '+' : ''}{pitchDelta}%</strong> compared to your personal baseline. {Math.abs(pitchDelta) > 15 ? 'This is a noticeable change.' : 'This is within a normal range.'}</span>
      </div>
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h3 className="font-display" style={{ fontSize: '1rem' }}>Acoustic Feature Trend</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {lineConfig.map(({ key, name, color }) => (
              <button key={key} id={`toggle-line-${key}`} onClick={() => toggleLine(key)} className="btn btn-sm" style={{ background: activeLines.includes(key) ? `${color}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${activeLines.includes(key) ? `${color}66` : 'var(--color-border)'}`, color: activeLines.includes(key) ? color : 'var(--color-text-muted)' }}>{name}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#606080', fontSize: 11 }} />
            <YAxis tick={{ fill: '#606080', fontSize: 11 }} domain={[0, 1]} />
            <Tooltip content={<CustomTooltip />} />
            {lineConfig.map(({ key, name, color }) => activeLines.includes(key) ? (
              <Line key={key} type="monotone" dataKey={key} name={name} stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 4, strokeWidth: 2, stroke: 'var(--color-bg)' }} activeDot={{ r: 6 }} />
            ) : null)}
            <ReferenceLine x="09-16" stroke="rgba(124,92,191,0.3)" strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 8 }}>Dashed line marks end of your personal baseline window (first 3 entries)</p>
      </div>
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 className="font-display" style={{ fontSize: '1rem', marginBottom: 16 }}>Reflection History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...history].reverse().map((entry) => (
            <div key={entry.id} className="animate-fade-in" style={{ border: `1px solid ${expandedEntry === entry.id ? 'rgba(124,92,191,0.35)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'border-color var(--transition-base)' }}>
              <button id={`entry-toggle-${entry.id}`} onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)} style={{ width: '100%', padding: '14px 16px', background: expandedEntry === entry.id ? 'rgba(124,92,191,0.08)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <Calendar size={14} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', minWidth: 80 }}>{new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}><EmotionBadge emotion={entry.emotion} /><SentimentBadge sentiment={entry.sentiment} /><FusionBadge result={entry.fusionResult} /></div>
                {expandedEntry === entry.id ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
              </button>
              {expandedEntry === entry.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7, paddingTop: 14, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>"{entry.transcript}"</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                    {[{ label: 'Pitch', value: entry.pitchVariation.toFixed(2) }, { label: 'Energy', value: entry.energy.toFixed(2) }, { label: 'Pause', value: entry.pauseDuration.toFixed(2) }].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', margin: 0 }}>{value}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
