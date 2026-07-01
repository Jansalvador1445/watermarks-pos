"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const logger_1 = require("../config/logger");
const ensureAdminUser_1 = require("../services/ensureAdminUser");
const mongoose_1 = __importDefault(require("mongoose"));
const seedAdmin = async () => {
    await (0, db_1.connectDB)();
    await (0, ensureAdminUser_1.ensureAdminUser)();
    await mongoose_1.default.disconnect();
    process.exit(0);
};
seedAdmin().catch((err) => {
    logger_1.logger.error('Admin seed failed', { error: err });
    process.exit(1);
});
//# sourceMappingURL=seedAdmin.js.map