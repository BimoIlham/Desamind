import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import {
  DEFAULT_APP_SETTINGS,
  normalizeBoundary,
  normalizeSettings,
  type AppSettings,
  type GeoBoundary,
} from '@/lib/map-settings';

export const DEFAULT_CENTER = {
  lat: DEFAULT_APP_SETTINGS.center_lat,
  lng: DEFAULT_APP_SETTINGS.center_lng,
};

export const LABUHAN_MARINGGAI = DEFAULT_CENTER;

export const VILLAGE_POLYGON_COORDS: GeoBoundary = [
  [
    [105.750, -5.310],
    [105.805, -5.320],
    [105.820, -5.350],
    [105.800, -5.365],
    [105.760, -5.355],
    [105.750, -5.310],
  ],
];

let cachedSettings: AppSettings | null = null;

export async function fetchSettings(options: { refresh?: boolean } = {}): Promise<AppSettings> {
  if (cachedSettings && !options.refresh) return cachedSettings;

  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (res.ok) {
      cachedSettings = normalizeSettings(await res.json());
      return cachedSettings;
    }
  } catch {
    // Keep the map usable when the API or network is unavailable.
  }

  return DEFAULT_APP_SETTINGS;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
}

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radius = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinVillage(
  lat: number,
  lng: number,
  options?: {
    boundaryCoords?: GeoBoundary | null;
    center?: { lat: number; lng: number };
    radiusM?: number;
  }
): boolean {
  const {
    boundaryCoords = null,
    center = DEFAULT_CENTER,
    radiusM = DEFAULT_APP_SETTINGS.fallback_radius_m,
  } = options ?? {};

  try {
    const normalizedBoundary = normalizeBoundary(boundaryCoords);
    if (normalizedBoundary && normalizedBoundary[0]?.length >= 4) {
      return booleanPointInPolygon(point([lng, lat]), polygon(normalizedBoundary));
    }

    const distance = getDistanceInMeters(lat, lng, center.lat, center.lng);
    return distance <= radiusM;
  } catch (error) {
    console.error('Geofence error:', error);
    return false;
  }
}
