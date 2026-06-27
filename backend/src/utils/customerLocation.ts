export const buildMapsUrl = (latitude: number, longitude: number): string =>
  `https://www.google.com/maps?q=${latitude},${longitude}`;

export const parseCoordsFromLegacyLink = (
  link?: string,
): { latitude?: number; longitude?: number } => {
  if (!link?.trim()) return {};

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

export const isValidCoordinatePair = (latitude?: number | null, longitude?: number | null): boolean =>
  latitude != null &&
  longitude != null &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;
