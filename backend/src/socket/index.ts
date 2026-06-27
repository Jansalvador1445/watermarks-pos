import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/accessToken=([^;]+)/)?.[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; role: string };
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);
    socket.join(`user:${socket.data.user.userId}`);
    socket.join('dashboard');

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const emitNotification = (target: 'all' | string, notification: unknown) => {
  if (!io) return;
  if (target === 'all') {
    io.emit('notification', notification);
  } else {
    io.to(`user:${target}`).emit('notification', notification);
  }
};

export const emitDashboardUpdate = (data: unknown) => {
  if (io) {
    io.to('dashboard').emit('dashboard:update', data);
  }
};
