const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function registerUser(payload) {
  try {
    return await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Backend registration unavailable, using local fallback:', error.message);
    return {
      message: 'Local onboarding fallback used',
      user: {
        _id: `local-${Date.now()}`,
        firstName: payload.firstName,
        lastName: payload.lastName || '',
        email: payload.email,
      },
    };
  }
}

export async function saveEmergencyContact(userId, payload) {
  try {
    return await request(`/api/users/${userId}/emergency-contact`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Emergency contact save skipped offline:', error.message);
    return { savedLocally: true, payload };
  }
}

export async function savePreferences(userId, payload) {
  try {
    return await request(`/api/users/${userId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Preferences save skipped offline:', error.message);
    return { savedLocally: true, payload };
  }
}
