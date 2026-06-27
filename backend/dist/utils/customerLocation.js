"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCoordinatePair = exports.parseCoordsFromLegacyLink = exports.buildMapsUrl = void 0;
const buildMapsUrl = (latitude, longitude) => `https://www.google.com/maps?q=${latitude},${longitude}`;
exports.buildMapsUrl = buildMapsUrl;
const parseCoordsFromLegacyLink = (link) => {
    if (!link?.trim())
        return {};
    const qMatch = link.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (qMatch) {
        return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };
    }
    const atMatch = link.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
        return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
    }
    return {};
};
exports.parseCoordsFromLegacyLink = parseCoordsFromLegacyLink;
const isValidCoordinatePair = (latitude, longitude) => latitude != null &&
    longitude != null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;
exports.isValidCoordinatePair = isValidCoordinatePair;
//# sourceMappingURL=customerLocation.js.map