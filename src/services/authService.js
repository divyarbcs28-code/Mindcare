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
    console.warn('Backend registration error:', error.message);
    throw error;
  }
}

export async function loginUser(payload) {
  return await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getEmergencyContact(userId) {
  if (!userId || String(userId).startsWith('local-')) return null;
  try {
    return await request(`/api/users/${userId}/emergency-contact`);
  } catch (error) {
    console.warn('Could not fetch emergency contact from database:', error.message);
    return null;
  }
}

export async function saveEmergencyContact(userId, payload) {
  if (!userId || String(userId).startsWith('local-')) {
    return { savedLocally: true, payload };
  }
  try {
    return await request(`/api/users/${userId}/emergency-contact`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Emergency contact save error:', error.message);
    throw error;
  }
}

export async function deleteEmergencyContact(userId) {
  if (!userId || String(userId).startsWith('local-')) return { savedLocally: true };
  try {
    return await request(`/api/users/${userId}/emergency-contact`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Emergency contact delete error:', error.message);
    throw error;
  }
}

export async function getProfile(userId) {
  if (!userId || String(userId).startsWith('local-')) return null;
  try {
    const data = await request(`/api/users/${userId}/profile`);
    return data.user;
  } catch (error) {
    console.warn('Could not fetch profile from database:', error.message);
    return null;
  }
}

export async function updateProfile(userId, payload) {
  if (!userId || String(userId).startsWith('local-')) {
    return { user: payload };
  }
  return await request(`/api/users/${userId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function savePreferences(userId, payload) {
  if (!userId || String(userId).startsWith('local-')) {
    return { savedLocally: true, payload };
  }
  try {
    return await request(`/api/users/${userId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Preferences save error:', error.message);
    return { savedLocally: true, payload };
  }
}
