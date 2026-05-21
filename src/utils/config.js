// Set at BUILD time on your host (Vercel, Netlify, etc.):
// VITE_API_URL=https://your-backend.onrender.com
// VITE_SOCKET_URL=https://your-backend.onrender.com  (optional, defaults to API URL)

const DEFAULT_PRODUCTION_API = 'https://kolchatbackend.onrender.com';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : import.meta.env.DEV
      ? ''
      : DEFAULT_PRODUCTION_API;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL !== undefined && import.meta.env.VITE_SOCKET_URL !== ''
    ? import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '')
    : API_BASE_URL || (import.meta.env.DEV ? window.location.origin : DEFAULT_PRODUCTION_API);
