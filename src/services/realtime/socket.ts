import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

import { env } from '../../config/env';
import type { Alert, Vital } from '../backend/types';

export type ServerToClientEvents = {
  'vitals:update': (payload: { userId: string; vital: Vital }) => void;
  'alert:triggered': (alert: Alert) => void;
  'connection:accepted': (payload: {
    connectionId: string;
    supervisorId: string;
  }) => void;
};

export type ClientSocket = Socket<ServerToClientEvents>;

let socket: ClientSocket | null = null;

export function connectSocket(token: string) {
  if (socket) return socket;
  socket = io(env.socketUrl, {
    // On web, start with polling then upgrade to websocket
    // On mobile, websocket directly is fine
    transports:
      Platform.OS === 'web' ? ['polling', 'websocket'] : ['websocket'],
    autoConnect: true,
    auth: { token },
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
