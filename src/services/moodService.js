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

// History is per-user: the backend identifies the owner from the session token.
const authHeaders = () => {
  try {
    const token = JSON.parse(localStorage.getItem('mindcare_user_data') || 'null')?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export async function fetchMoodEntries() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reflections`, { headers: authHeaders() });
    // Signed out or session expired: show no history rather than someone else's or mock data.
    if (res.status === 401) return [];
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
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
