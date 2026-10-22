import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import PageHero from '../components/shared/PageHero';

const supportCategories = [
  {
    id: 'focus',
    type: 'focus',
    emoji: '🎯',
    title: "Can't Focus",
    color: '#7C5CBF',
    desc: 'Techniques to sharpen your concentration',
    activities: [
      {
        id: 'pomodoro',
        title: 'Pomodoro Timer',
        emoji: '⏱️',
        duration: '25 min',
        desc: 'Work for 25 minutes, then take a 5-minute break. One of the most effective focus techniques.',
        steps: ['Choose one task to focus on', 'Set a timer for 25 minutes', 'Work on the task until the timer rings', 'Take a 5-minute break', 'Repeat 4 times, then take a longer break'],
      },
      {
        id: 'body-scan',
        title: '2-Minute Body Scan',
        emoji: '🧘',
        duration: '2 min',
        desc: 'Quickly ground yourself before starting a task.',
        steps: ['Sit comfortably in your chair', 'Take three slow, deep breaths', 'Notice how your feet feel on the floor', 'Relax your shoulders', 'Set one clear intention for the next 25 minutes'],
      },
    ],
  },
  {
    id: 'tired',
    type: 'tired',
    emoji: '😮💨',
    title: 'Mentally Tired',
    color: '#E76F51',
    desc: 'Recharge your mental battery',
    activities: [
      {
        id: 'micro-break',
        title: '5-Minute Walk',
        emoji: '🚶',
        duration: '5 min',
        desc: 'A short walk is proven to restore mental energy better than scrolling your phone.',
        steps: ['Put your phone away', 'Stand up and stretch first', 'Walk somewhere — outside if possible', 'Breathe slowly and notice your surroundings', 'Return and tackle one small task only'],
      },
      {
        id: 'power-nap',
        title: 'Power Nap Guide',
        emoji: '😴',
        duration: '20 min',
        desc: '20 minutes is the perfect nap length — enough to refresh without grogginess.',
        steps: ['Find a quiet, slightly cool place', 'Set an alarm for exactly 20 minutes', 'Lie down or sit back comfortably', 'Close your eyes, do not check your phone', 'When the alarm rings, splash cold water on your face'],
      },
    ],
  },
  {
    id: 'break',
    type: 'break',
    emoji: '🌿',
    title: 'Need a Break',
    color: '#5ECFB1',
    desc: 'Step away and recharge',
    activities: [
      {
        id: 'grounding',
        title: 'Grounding Exercise',
        emoji: '🌱',
        duration: '3 min',
        desc: 'The 5-4-3-2-1 grounding technique to bring you back to the present moment.',
        steps: ['5 — Name 5 things you can see right now', '4 — Name 4 things you can physically feel', '3 — Name 3 things you can hear', '2 — Name 2 things you can smell', '1 — Name 1 thing you can taste'],
      },
      {
        id: 'stretch',
        title: 'Desk Stretch Routine',
        emoji: '🤸',
        duration: '4 min',
        desc: 'Quick stretches you can do at your desk without standing up.',
        steps: ['Neck rolls — slowly 3 times each direction', 'Shoulder shrugs — raise and hold 5 seconds, release', 'Wrist circles — 10 times each hand', 'Seated twist — turn left, hold 15s, then right', 'Take one deep belly breath to finish'],
      },
    ],
  },
  {
    id: 'relax',
    type: 'relax',
    emoji: '🧘',
    title: 'Want to Relax',
    color: '#F4A261',
    desc: 'Wind down and find calm',
    activities: [
      {
        id: 'box-breathing',
        title: 'Box Breathing',
        emoji: '💨',
        duration: '4 min',
        desc: 'Used by athletes and navy SEALs to calm the nervous system quickly.',
        steps: ['Breathe IN for 4 seconds', 'HOLD for 4 seconds', 'Breathe OUT for 4 seconds', 'HOLD for 4 seconds', 'Repeat 4 times — you should feel calmer'],
      },
      {
        id: 'brain-dump',
        title: 'Brain Dump',
        emoji: '📝',
        duration: '5 min',
        desc: 'Write everything in your head onto paper. Do not filter or edit.',
        steps: ['Get a notebook or open a blank doc', 'Set a timer for 5 minutes', 'Write every thought without stopping', 'Do not edit, correct, or judge what you write', 'When done, close the doc. You do not need to read it.'],
      },
    ],
  },
];

function ActivityCard({ activity, color, onClose }) {
  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2rem' }}>{activity.emoji}</span>
            <div>
              <h3 style={{ margin: 0 }}>{activity.title}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Duration: {activity.duration}</p>
            </div>
          </div>
          <button id="btn-close-activity" onClick={onClose} className="btn btn-secondary btn-icon"><X size={18} /></button>
        </div>
        <p style={{ marginBottom: 20, lineHeight: 1.65 }}>{activity.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activity.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 28, height: 28, borderRadius: '50%', background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color, flexShrink: 0 }}>{i + 1}</div>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, paddingTop: 4 }}>{step}</p>
            </div>
          ))}
        </div>
        <button id="btn-done-activity" onClick={onClose} className="btn btn-primary w-full" style={{ marginTop: 24 }}>Done</button>
      </div>
    </div>
  );
}

export default function QuickSupport() {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#7C5CBF');

  const openActivity = (activity, color) => { setSelectedActivity(activity); setSelectedColor(color); };

  return (
    <div className="animate-fade-in">
      <PageHero
        image="/images/support-meditate.webp"
        position="center 35%"
        eyebrow="Support"
        title="Quick Support"
        subtitle="One-tap activities to help you feel better right now."
      />
      <div style={{ padding: '14px 18px', marginBottom: 28, background: 'rgba(231,111,81,0.07)', border: '1px solid rgba(231,111,81,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.83rem', lineHeight: 1.65 }}>
        In crisis? Please reach out to iCall India: <strong style={{ color: 'var(--color-danger)' }}>9152987821</strong> or visit the <a href="/about" style={{ color: 'var(--color-primary-light)' }}>About and Safety</a> page.
      </div>
      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {supportCategories.map((cat) => (
          <div key={cat.id} className="glass-card animate-fade-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${cat.color}22`, border: `1px solid ${cat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{cat.emoji}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{cat.title}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cat.desc}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
              {cat.activities.map((act) => (
                <button key={act.id} id={`act-${act.id}`} onClick={() => openActivity(act, cat.color)} className="btn btn-secondary" style={{ padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, textAlign: 'left', height: 'auto', whiteSpace: 'normal', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.3rem' }}>{act.emoji}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{act.duration}</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{act.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{act.desc.substring(0, 55)}...</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedActivity && (<ActivityCard activity={selectedActivity} color={selectedColor} onClose={() => setSelectedActivity(null)} />)}
    </div>
  );
}
