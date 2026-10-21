import { ArrowRight, BrainCircuit, CheckCircle2, HeartPulse, Mic, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Mic,
    title: 'Voice reflection',
    desc: 'Record how you feel in your own words and let the system understand what your tone and expression are saying.',
  },
  {
    icon: TrendingUp,
    title: 'Personal insights',
    desc: 'Track patterns over time with a personal baseline instead of generic wellness scores.',
  },
  {
    icon: ShieldCheck,
    title: 'Supportive guidance',
    desc: 'Get small, practical suggestions for grounding, breathing, and emotional check-ins when stress rises.',
  },
];

const stats = [
  { label: 'Daily reflections', value: '10k+' },
  { label: 'Mood patterns tracked', value: '24/7' },
  { label: 'Support suggestions', value: 'AI-guided' },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header glass-card">
        <div className="brand-wrap">
          <div className="brand-badge">
            <BrainCircuit size={20} />
          </div>
          <span className="brand-name">MindCare</span>
        </div>

        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#support">Support</a>
        </nav>

        <div className="landing-actions">
          <Link to="/login" className="btn btn-secondary">Sign in</Link>
          <Link to="/register" className="btn btn-primary">Get started</Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={14} /> Thoughtful emotional care
            </span>
            <h1>
              Understand your mood with <span className="gradient-text">voice, reflection, and support</span>.
            </h1>
            <p>
              MindCare helps you notice emotional patterns early, reflect on your day, and get gentle recommendations before stress becomes overwhelming.
            </p>

            <div className="cta-row">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start your reflection <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">See how it works</a>
            </div>

            <div className="mini-trust-row">
              {['Private', 'Personalized', 'Gentle'].map((item) => (
                <span key={item} className="trust-pill">
                  <CheckCircle2 size={14} /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-visual glass-card">
            <div className="phone-card">
              <div className="phone-header">
                <span className="dot dot-one" />
                <span className="dot dot-two" />
                <span className="dot dot-three" />
              </div>

              <div className="phone-body">
                <div className="mood-box positive">
                  <HeartPulse size={18} />
                  <div>
                    <p>Today’s mood</p>
                    <strong>Calm + focused</strong>
                  </div>
                </div>

                <div className="wave-card">
                  <span>Voice pattern</span>
                  <div className="mini-wave">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <i key={index} style={{ height: `${20 + ((index * 13) % 60)}%` }} />
                    ))}
                  </div>
                </div>

                <div className="insight-card">
                  <p>Suggested exercise</p>
                  <strong>Grounding breath</strong>
                  <small>Recommended based on your recent reflection</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="feature-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="glass-card feature-card">
              <div className="feature-icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </section>

        <section className="stats-row">
          {stats.map(({ value, label }) => (
            <div key={label} className="glass-card stat-card">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section id="how-it-works" className="steps-section">
          <div className="section-heading">
            <span className="eyebrow">
              <Sparkles size={14} /> How it works
            </span>
            <h2>Simple steps that create better self-awareness.</h2>
          </div>

          <div className="steps-grid">
            {[
              ['01', 'Record', 'Speak about your day or emotions in a short voice reflection.'],
              ['02', 'Understand', 'Look at your tone, transcript, and emotional patterns over time.'],
              ['03', 'Support', 'Receive a calm, relevant suggestion for the next moment.'],
            ].map(([step, title, desc]) => (
              <div key={step} className="glass-card step-card">
                <span className="step-index">{step}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="support" className="cta-banner glass-card">
          <div>
            <span className="eyebrow dark">
              <HeartPulse size={14} /> Supportive care
            </span>
            <h2>Take a gentle step toward feeling more grounded.</h2>
          </div>
          <Link to="/login" className="btn btn-primary btn-lg">
            Begin now <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    </div>
  );
}
