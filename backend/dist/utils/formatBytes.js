"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = void 0;
const formatBytes = (bytes) => {
    if (bytes === 0)
        return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / 1024 ** i;
    return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};
exports.formatBytes = formatBytes;
//# sourceMappingURL=formatBytes.js.map