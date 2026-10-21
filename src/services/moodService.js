const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const normalizeEntry = (entry) => ({
  id: entry._id || entry.id,
  date: entry.date || entry.createdAt || new Date().toISOString(),
  transcript: entry.transcript || entry.content || '',
  emotion: entry.emotion || 'neutral',
  emotionConfidence: Number(entry.emotionConfidence ?? 0.7),
  sentiment: entry.sentiment || null,
  sentimentConfidence: Number(entry.sentimentConfidence ?? 0.0),
  voiceDeviation: entry.voiceDeviation || 'moderate',
  fusionResult: entry.fusionResult || 'stable',
  pitchVariation: Number(entry.pitchVariation ?? 0.5),
  energy: Number(entry.energy ?? 0.5),
  pauseDuration: Number(entry.pauseDuration ?? 0.3),
  themes: Array.isArray(entry.themeTags) ? entry.themeTags : [],
  suggestedActivity: entry.suggestedActivity || null,
});

export async function fetchMoodEntries() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reflections`);
    if (!res.ok) throw new Error('Unable to fetch reflections');
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeEntry) : [];
  } catch (error) {
    console.warn('Falling back to mock history because the backend is unavailable:', error.message);
    const { mockHistory } = await import('../data/mockHistory.js');
    return mockHistory;
  }
}

export async function saveMoodEntry(entry) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'demo_user',
        type: 'text',
        content: entry.transcript || entry.note || '',
        transcript: entry.transcript || entry.note || '',
        emotion: entry.emotion || 'neutral',
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Unable to save reflection');
    }

    const data = await res.json();
    return normalizeEntry(data);
  } catch (error) {
    console.warn('Saved locally only because backend is unavailable:', error.message);
    return normalizeEntry({
      ...entry,
      id: entry.id || `local-${Date.now()}`,
      date: entry.date || new Date().toISOString(),
    });
  }
}
