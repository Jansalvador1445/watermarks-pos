import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
export declare const initSocket: (server: HttpServer) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => Server;
export declare const emitNotification: (target: "all" | string, notification: unknown) => void;
export declare const emitDashboardUpdate: (data: unknown) => void;
//# sourceMappingURL=index.d.ts.map