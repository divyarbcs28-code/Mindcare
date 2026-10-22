import { useEffect, useState } from 'react';
import { ArrowRight, BrainCircuit, HeartPulse, Lock, Mic, PenLine, ShieldCheck, Sparkles, TrendingUp, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';

const features = [
  {
    icon: Mic,
    image: '/images/reflect-mountain.webp',
    title: 'Voice reflection',
    desc: 'Speak freely about your day. MindCare transcribes it and looks at both your words and the way you sound.',
  },
  {
    icon: TrendingUp,
    image: '/images/progress-road.webp',
    title: 'Personal insights',
    desc: 'See how your mood moves over time, compared with your own baseline rather than anyone else’s.',
  },
  {
    icon: ShieldCheck,
    image: '/images/support-meditate.webp',
    title: 'Gentle support',
    desc: 'Breathing, grounding and small activities suggested for the moment you are in.',
  },
];

const steps = [
  {
    step: '01',
    icon: PenLine,
    image: '/images/journal.webp',
    title: 'Speak or write',
    desc: 'Record a short voice note or type a journal entry. There is no right way to feel.',
  },
  {
    step: '02',
    icon: BrainCircuit,
    image: '/images/pen.webp',
    title: 'Understand the pattern',
    desc: 'Emotion and sentiment are read from what you say; your voice is compared with your own recent recordings.',
  },
  {
    step: '03',
    icon: Wind,
    image: '/images/support-yoga.webp',
    title: 'Take a small step',
    desc: 'Get one calm, practical suggestion and watch your progress build over the weeks.',
  },
];

const feelings = ['calm', 'hopeful', 'tired', 'anxious', 'grateful', 'focused', 'overwhelmed', 'proud', 'lonely', 'content', 'restless', 'joyful'];

const facts = [
  { value: '2', label: 'ways to reflect — voice or text' },
  { value: '0', label: 'diagnoses — patterns only' },
  { value: '100%', label: 'your own history, private to you' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useReveal('landing');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp">
      <header className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <Link to="/" className="lp-brand">
          <span className="lp-brand__mark"><BrainCircuit size={20} /></span>
          MindCare
        </Link>
        <nav className="lp-nav__links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#care">Care</a>
        </nav>
        <div className="lp-nav__actions">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero__media" aria-hidden="true" />
        <div className="lp-hero__shade" aria-hidden="true" />

        <div className="lp-hero__inner">
          <div className="lp-hero__copy">
            <span className="lp-eyebrow lp-rise" style={{ '--d': '0ms' }}>
              <Sparkles size={14} /> A quiet space for your mind
            </span>
            <h1 className="lp-rise" style={{ '--d': '120ms' }}>
              Pause. Breathe.<br /><em>Hear how you feel.</em>
            </h1>
            <p className="lp-rise" style={{ '--d': '240ms' }}>
              MindCare listens to your reflections, notices gentle shifts in your mood, and offers small steps
              before stress builds up.
            </p>
            <div className="lp-hero__cta lp-rise" style={{ '--d': '360ms' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Start reflecting <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn btn-glass btn-lg">See how it works</a>
            </div>
          </div>

          <div className="lp-float" aria-hidden="true">
            <div className="lp-float__card lp-float__card--mood">
              <HeartPulse size={18} />
              <div>
                <small>Today&rsquo;s mood</small>
                <strong>Calm &amp; focused</strong>
              </div>
            </div>
            <div className="lp-float__card lp-float__card--wave">
              <small>Listening&hellip;</small>
              <div className="lp-wave">
                {Array.from({ length: 22 }).map((_, i) => (
                  <i key={i} style={{ '--h': `${25 + ((i * 37) % 70)}%`, '--i': i }} />
                ))}
              </div>
            </div>
            <div className="lp-float__card lp-float__card--tip">
              <Wind size={18} />
              <div>
                <small>Suggested for you</small>
                <strong>4-7-8 breathing</strong>
              </div>
            </div>
          </div>
        </div>

        <a href="#features" className="lp-scroll" aria-label="Scroll to features"><span /></a>
      </section>

      {/* Feelings marquee */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee__track">
          {[...feelings, ...feelings].map((f, i) => <span key={i}>{f}</span>)}
        </div>
      </div>

      <main className="lp-main">
        {/* Features */}
        <section id="features" className="lp-section">
          <div className="lp-heading reveal">
            <span className="lp-eyebrow">What MindCare does</span>
            <h2>Built around <em>you</em>, not a score.</h2>
          </div>
          <div className="lp-features">
            {features.map(({ icon: Icon, image, title, desc }, i) => (
              <article key={title} className="lp-feature reveal" style={{ '--d': `${i * 120}ms` }}>
                <div className="lp-feature__img" style={{ backgroundImage: `url(${image})` }} />
                <div className="lp-feature__body">
                  <span className="lp-feature__icon"><Icon size={20} /></span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="lp-section">
          <div className="lp-heading reveal">
            <span className="lp-eyebrow">How it works</span>
            <h2>Three small steps toward <em>self-awareness</em>.</h2>
          </div>
          <div className="lp-steps">
            {steps.map(({ step, icon: Icon, image, title, desc }) => (
              <div key={step} className="lp-step reveal">
                <div className="lp-step__img">
                  <img src={image} alt="" loading="lazy" />
                </div>
                <div className="lp-step__text">
                  <span className="lp-step__num">{step}</span>
                  <h3><Icon size={22} /> {title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Honest facts */}
        <section className="lp-facts">
          {facts.map(({ value, label }, i) => (
            <div key={label} className="lp-fact reveal" style={{ '--d': `${i * 100}ms` }}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>
      </main>

      {/* Quote over parallax photo */}
      <section className="lp-quote">
        <div className="lp-quote__media" aria-hidden="true" />
        <blockquote className="reveal">
          &ldquo;Feelings are much like waves. We can&rsquo;t stop them from coming, but we can choose which ones to surf.&rdquo;
          <cite>&mdash; Jonatan M&aring;rtensson</cite>
        </blockquote>
      </section>

      <main className="lp-main">
        <section id="care" className="lp-cta reveal">
          <div className="lp-cta__img" aria-hidden="true" />
          <div className="lp-cta__body">
            <span className="lp-eyebrow"><Lock size={14} /> Private by design</span>
            <h2>Take a gentle step toward feeling more grounded.</h2>
            <p>
              MindCare is a reflection tool, not a diagnosis. If you are ever in crisis, please reach out to a trusted
              person or a local helpline right away.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create your space <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <span className="lp-brand"><span className="lp-brand__mark"><BrainCircuit size={16} /></span> MindCare</span>
        <span>A student mini-project &middot; Photos from Unsplash</span>
      </footer>
    </div>
  );
}
