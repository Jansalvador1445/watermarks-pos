"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerPhotoUrl = exports.customerPhotoUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
const customersDir = path_1.default.join(process.cwd(), env_1.env.UPLOAD_DIR, 'customers');
if (!fs_1.default.existsSync(customersDir)) {
    fs_1.default.mkdirSync(customersDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, customersDir),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const imageFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new response_1.AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400), false);
    }
};
exports.customerPhotoUpload = (0, multer_1.default)({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
const getCustomerPhotoUrl = (filename) => filename ? `/uploads/customers/${filename}` : undefined;
exports.getCustomerPhotoUrl = getCustomerPhotoUrl;
//# sourceMappingURL=upload.js.map