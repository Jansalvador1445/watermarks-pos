"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSearchQuery = exports.escapeRegex = exports.getPagination = void 0;
const getPagination = (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    return { page, limit, skip, sort: { [sortBy]: sortOrder } };
};
exports.getPagination = getPagination;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
exports.escapeRegex = escapeRegex;
const buildSearchQuery = (search, fields) => {
    if (!search?.trim())
        return {};
    const regex = new RegExp((0, exports.escapeRegex)(search.trim()), 'i');
    return {
        $or: fields.map((field) => ({ [field]: regex })),
    };
};
exports.buildSearchQuery = buildSearchQuery;
//# sourceMappingURL=pagination.js.map