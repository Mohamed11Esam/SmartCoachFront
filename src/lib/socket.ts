import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('access_token');
    socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      auth: {
        token: token || '',
      },
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }

  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  const token = localStorage.getItem('access_token');
  if (s.auth && typeof s.auth === 'object') {
    (s.auth as Record<string, any>).token = token || '';
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
