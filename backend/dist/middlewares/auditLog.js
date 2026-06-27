"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const Notification_1 = require("../models/Notification");
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const auditLog = (module, action) => (req, res, next) => {
    if (!WRITE_METHODS.includes(req.method)) {
        return next();
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode < 400) {
            Notification_1.Log.create({
                userId: req.user?.userId,
                action: action || `${req.method} ${req.originalUrl}`,
                module,
                ipAddress: req.ip || req.socket.remoteAddress,
                metadata: {
                    method: req.method,
                    path: req.originalUrl,
                    body: sanitizeBody(req.body),
                },
            }).catch(() => { });
        }
        return originalJson(body);
    };
    next();
};
exports.auditLog = auditLog;
const sanitizeBody = (body) => {
    if (!body)
        return {};
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.passwordHash;
    return sanitized;
};
//# sourceMappingURL=auditLog.js.map