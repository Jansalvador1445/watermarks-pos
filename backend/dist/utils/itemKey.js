"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLabelFromKey = exports.slugifyItemKey = void 0;
const slugifyItemKey = (text) => {
    const slug = text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || 'item';
};
exports.slugifyItemKey = slugifyItemKey;
const defaultLabelFromKey = (itemKey) => itemKey
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
exports.defaultLabelFromKey = defaultLabelFromKey;
//# sourceMappingURL=itemKey.js.map