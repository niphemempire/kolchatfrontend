// In dev, use same-origin requests via Vite proxy (/api -> backend). Override with VITE_API_URL if needed.
const BASE_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? ''
      : 'https://kolchatbackend.onrender.com';

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    const error = new Error(
      'Cannot reach the server. Start the backend: cd backend && npm run dev'
    );
    error.status = 0;
    throw error;
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const error = new Error('Invalid response from server');
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || data?.Error || response.statusText);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
