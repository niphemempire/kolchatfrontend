import { API_BASE_URL } from './config';

export { API_BASE_URL };

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

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
      `Cannot reach the API at ${API_BASE_URL || '(same origin)'}. Check that the backend is running and VITE_API_URL is set correctly when you build the frontend.`
    );
    error.status = 0;
    throw error;
  }

  const text = await response.text();
  let data = null;

  if (text) {
    const trimmed = text.trim();
    if (trimmed.startsWith('<')) {
      const error = new Error(
        `The server returned a web page instead of JSON (HTTP ${response.status}). Your frontend is probably calling the wrong URL. Rebuild with VITE_API_URL set to your backend, e.g. https://kolchatbackend.onrender.com — not your React hosting URL.`
      );
      error.status = response.status;
      throw error;
    }
    try {
      data = JSON.parse(trimmed);
    } catch {
      const preview = trimmed.slice(0, 80);
      const error = new Error(
        `Invalid response from server (HTTP ${response.status}). Expected JSON from ${url}. Response started with: "${preview}…"`
      );
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
