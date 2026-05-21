import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL !== undefined && import.meta.env.VITE_SOCKET_URL !== ''
    ? import.meta.env.VITE_SOCKET_URL
    : import.meta.env.DEV
      ? window.location.origin
      : 'https://kolchatbackend.onrender.com';

let socket = null;

export function connectSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  } else if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
