/* eslint-disable react-refresh/only-export-components */
// ============================================================
// src/context/SocketContext.jsx
// Creates socket only after login, disconnects on logout
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/axios.js';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Create socket connection with auth token
    const s = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: {
        token: getAccessToken(),
      },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    Promise.resolve().then(() => setSocket(s));

    s.on('connect', () => {
      setIsConnected(true);
      // Join personal room
      s.emit('user:join');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    s.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const isUserOnline = (userId) => onlineUsers.has(userId);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
