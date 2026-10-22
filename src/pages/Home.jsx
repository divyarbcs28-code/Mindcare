import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Heart, BarChart2, Smile, ChevronRight, TrendingUp, Activity, Zap } from 'lucide-react';
import { mockHistory, fusionLabels, emotionLabels } from '../data/mockHistory';
import { fetchMoodEntries } from '../services/moodService';
import PageHero from '../components/shared/PageHero';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

// Greeting photo follows the time of day.
function getTimeImage() {
  const h = new Date().getHours();
  if (h < 12) return '/images/time-morning.webp';
  if (h < 17) return '/images/time-afternoon.webp';
  if (h < 21) return '/images/time-evening.webp';
  return '/images/time-night.webp';
}

function getRecentPatternFromHistory(recent) {
  const negCount = recent.filter(e => e.emotion === 'negative').length;
  const highDev = recent.filter(e => e.voiceDeviation === 'high').length;
  if (negCount >= 2 && highDev >= 2) return 'significant_change';
  if (negCount >= 1 || highDev >= 1) return 'expression_change';
  return 'stable';
}

function getRecentPattern() {
  return getRecentPatternFromHistory(mockHistory.slice(-3));
}

const quickActions = [
  { to: '/reflect', icon: Mic,      label: 'Reflect',       desc: 'Record a voice reflection',   color: '#7C5CBF', id: 'qa-reflect',  image: '/images/reflect-mountain.webp' },
  { to: '/support', icon: Heart,    label: 'Support',       desc: 'Quick help & activities',      color: '#E76F51', id: 'qa-support',  image: '/images/support-meditate.webp' },
  { to: '/insights',icon: BarChart2,label: 'Insights',      desc: 'View your pattern trends',     color: '#5ECFB1', id: 'qa-insights', image: '/images/progress-road.webp' },
  { to: '/funzone', icon: Smile,    label: 'Fun Zone',      desc: 'Jokes, quizzes & games',       color: '#F4A261', id: 'qa-funzone',  image: '/images/funzone-friends.webp' },
];

const supportCards = [
  { label: "Can't Focus",    emoji: '🎯', to: '/support?type=focus',   id: 'sup-focus'   },
  { label: 'Mentally Tired', emoji: '😮‍💨', to: '/support?type=tired',   id: 'sup-tired'   },
  { label: 'Need a Break',   emoji: '🌿', to: '/support?type=break',   id: 'sup-break'   },
  { label: 'Want to Relax',  emoji: '🧘', to: '/support?type=relax',   id: 'sup-relax'   },
];

export default function Home({ userName }) {
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState(mockHistory);

  useEffect(() => setMounted(true), []);

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

  const latest = history[history.length - 1] || mockHistory[mockHistory.length - 1];
  const recentSlice = history.slice(-3);
  const overallPattern = getRecentPatternFromHistory(recentSlice);
  const patternMeta = fusionLabels[overallPattern];
  const emotionMeta = emotionLabels[latest.emotion];

  return (
    <div className={`animate-fade-in`} style={{ paddingTop: 8 }}>
      {/* Greeting */}
      <PageHero
        tall
        image={getTimeImage()}
        eyebrow={getGreeting()}
        title={userName ? `Hey, ${userName.split(' ')[0]} 👋` : 'Welcome back 👋'}
        subtitle="How are you feeling today? Take a moment to check in with yourself."
      />

      {/* CTA Record Button */}
      <Link to="/reflect" id="home-reflect-cta" style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
        <div className="glass-card animate-glow" style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(124,92,191,0.2) 0%, rgba(94,207,177,0.1) 100%)',
          borderColor: 'rgba(124,92,191,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-primary)',
          }}>
            <Mic size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 className="font-display" style={{ marginBottom: 4, fontSize: '1.15rem' }}>
              🎙 Start Today's Reflection
            </h3>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Record 10–30 seconds · Get text + voice analysis
            </p>
          </div>
          <ChevronRight size={20} color="var(--color-text-muted)" />
        </div>
      </Link>

      {/* Recent Pattern Card */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="font-display" style={{ fontSize: '1rem' }}>Your Recent Pattern</h3>
          <Link to="/insights" id="home-view-history" className="btn btn-secondary btn-sm">
            View History
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Expression */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={16} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Expression</span>
            </div>
            <span className={`badge ${latest.emotion === 'positive' ? 'badge-stable' : latest.emotion === 'negative' ? 'badge-significant' : 'badge-neutral'}`}>
              <span style={{ color: emotionMeta.color }}>●</span>
              {emotionMeta.label}
            </span>
          </div>

          {/* Sentiment */}
          {latest.sentiment && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={16} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Sentiment</span>
              </div>
              <span className={`badge ${latest.sentiment.toUpperCase() === 'POSITIVE' ? 'badge-stable' : 'badge-significant'}`}>
                <span style={{ color: latest.sentiment.toUpperCase() === 'POSITIVE' ? '#5ECFB1' : '#E76F51' }}>●</span>
                {latest.sentiment}
              </span>
            </div>
          )}

          {/* Voice Pattern */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mic size={16} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Voice Pattern</span>
            </div>
            <span className={`badge ${latest.voiceDeviation === 'low' ? 'badge-stable' : latest.voiceDeviation === 'high' ? 'badge-significant' : 'badge-change'}`}>
              <span>●</span>
              {latest.voiceDeviation === 'low' ? 'Similar to baseline' : latest.voiceDeviation === 'high' ? 'High deviation' : 'Moderate deviation'}
            </span>
          </div>

          {/* Overall */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={16} color="var(--color-text-muted)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Overall (3-day)</span>
            </div>
            <span className={`badge ${overallPattern === 'stable' ? 'badge-stable' : overallPattern === 'significant_change' ? 'badge-significant' : 'badge-change'}`}>
              <span>{patternMeta.icon}</span>
              {patternMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Support */}
      <div style={{ marginBottom: 24 }}>
        <h3 className="font-display" style={{ marginBottom: 14, fontSize: '1rem' }}>Quick Support</h3>
        <div className="grid-2 grid-2-mobile stagger" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {supportCards.map(({ label, emoji, to, id }) => (
            <Link key={id} to={to} id={id} style={{ textDecoration: 'none' }}>
              <div className="glass-card animate-fade-in" style={{
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div style={{ marginBottom: 24 }}>
        <h3 className="font-display" style={{ marginBottom: 14, fontSize: '1rem' }}>Explore</h3>
        <div className="grid-2 stagger" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {quickActions.map(({ to, icon: Icon, label, desc, color, id, image }, i) => (
            <Link key={id} to={to} id={id} className="photo-tile reveal" style={{ '--d': `${i * 80}ms` }}>
              <div className="photo-tile__img" style={{ backgroundImage: `url(${image})` }} />
              <div className="photo-tile__body">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon size={18} color={color} /> {label}</h3>
                <p>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Fun Zone Teaser */}
      <Link to="/funzone" id="home-funzone-teaser" style={{ textDecoration: 'none', display: 'block' }}>
        <div className="glass-card" style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(244,162,97,0.1) 0%, rgba(231,111,81,0.06) 100%)',
          borderColor: 'rgba(244,162,97,0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '2rem' }}>🎮</span>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Fun Zone</h4>
              <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--color-warning)' }}>
                Jokes · Quizzes · Games — take a break!
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="var(--color-warning)" />
        </div>
      </Link>
    </div>
  );
}
