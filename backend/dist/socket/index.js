"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitDashboardUpdate = exports.emitNotification = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: env_1.env.CLIENT_URL,
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/accessToken=([^;]+)/)?.[1];
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.debug(`Socket connected: ${socket.id}`);
        socket.join(`user:${socket.data.user.userId}`);
        socket.join('dashboard');
        socket.on('disconnect', () => {
            logger_1.logger.debug(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
};
exports.getIO = getIO;
const emitNotification = (target, notification) => {
    if (!io)
        return;
    if (target === 'all') {
        io.emit('notification', notification);
    }
    else {
        io.to(`user:${target}`).emit('notification', notification);
    }
};
exports.emitNotification = emitNotification;
const emitDashboardUpdate = (data) => {
    if (io) {
        io.to('dashboard').emit('dashboard:update', data);
    }
};
exports.emitDashboardUpdate = emitDashboardUpdate;
//# sourceMappingURL=index.js.map