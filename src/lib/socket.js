import { io } from 'socket.io-client';

let socketInstance = null;

export const useSocket = () => {
  // Guard against server-side rendering (Next.js)
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');
  }

  return socketInstance;
};