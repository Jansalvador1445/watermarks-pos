/** Returns true when the value can be opened in maps/browser. */
export const isNavigableLocationLink = (value?: string): boolean => {
  if (!value?.trim()) return false;
  const v = value.trim();
  return /^https?:\/\//i.test(v) || /^geo:/i.test(v);
};

export const openLocationLink = (value: string) => {
  if (isNavigableLocationLink(value)) {
    window.open(value, '_blank', 'noopener,noreferrer');
  }
};

export const buildMapsUrl = (latitude: number, longitude: number): string =>
  `https://www.google.com/maps?q=${latitude},${longitude}`;

export const formatCoordinates = (latitude?: number | null, longitude?: number | null): string => {
  if (latitude == null || longitude == null) return 'Not set';
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

export const hasValidCoordinates = (latitude?: number | null, longitude?: number | null): boolean =>
  latitude != null &&
  longitude != null &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

export const getCustomerMapsUrl = (
  customer: { latitude?: number; longitude?: number; mapsUrl?: string },
): string | undefined => {
  if (customer.mapsUrl) return customer.mapsUrl;
  if (hasValidCoordinates(customer.latitude, customer.longitude)) {
    return buildMapsUrl(customer.latitude!, customer.longitude!);
  }
  return undefined;
};

/** Extract latitude/longitude from Google Maps, Waze, or geo URLs. */
export const parseCoordsFromUrl = (
  link?: string,
): { latitude?: number; longitude?: number } => {
  if (!link?.trim()) return {};

  const trimmed = link.trim();

  const qMatch = trimmed.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qMatch) {
    return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };
  }

  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
  }

  const llMatch = trimmed.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (llMatch) {
    return { latitude: Number(llMatch[1]), longitude: Number(llMatch[2]) };
  }

  return {};
};
