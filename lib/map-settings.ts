export type GeoCoord = [number, number]; // [lng, lat]
export type GeoBoundary = GeoCoord[][];

export interface AppSettings {
  village_name: string;
  district_name: string;
  city_name: string;
  province_name: string;
  center_lat: number;
  center_lng: number;
  boundary_geojson: GeoBoundary | null;
  fallback_radius_m: number;
}

export const SETTINGS_ROW_ID = 'default';

export const MAP_TILE_LAYERS = {
  street: {
    label: 'Jalan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
  },
  satellite: {
    label: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 20,
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
} as const;

export type MapLayerKey = keyof typeof MAP_TILE_LAYERS;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  village_name: 'Labuhan Maringgai',
  district_name: 'Labuhan Maringgai',
  city_name: 'Lampung Timur',
  province_name: 'Lampung',
  center_lat: -5.3428912,
  center_lng: 105.7938069,
  boundary_geojson: null,
  fallback_radius_m: 2500,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function finiteNumber(value: unknown, fallback: number) {
  const numberValue = typeof value === 'string' ? Number(value) : value;
  return typeof numberValue === 'number' && Number.isFinite(numberValue)
    ? numberValue
    : fallback;
}

function coordinateNumber(value: unknown, fallback: number, min: number, max: number) {
  const numberValue = finiteNumber(value, fallback);
  return numberValue >= min && numberValue <= max ? numberValue : fallback;
}

function coordFromUnknown(value: unknown): GeoCoord | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = finiteNumber(value[0], NaN);
  const lat = finiteNumber(value[1], NaN);
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
}

function sameCoord(a: GeoCoord, b: GeoCoord) {
  return a[0] === b[0] && a[1] === b[1];
}

function normalizeRing(value: unknown): GeoCoord[] | null {
  if (!Array.isArray(value)) return null;
  const ring = value.map(coordFromUnknown).filter((coord): coord is GeoCoord => coord !== null);
  if (ring.length < 3) return null;
  if (!sameCoord(ring[0], ring[ring.length - 1])) ring.push([...ring[0]]);

  const unique = new Set(ring.slice(0, -1).map(([lng, lat]) => `${lng},${lat}`));
  return unique.size >= 3 ? ring : null;
}

export function normalizeBoundary(value: unknown): GeoBoundary | null {
  if (!value) return null;

  const record = asRecord(value);
  if (record) {
    if (record.type === 'Feature') {
      return normalizeBoundary(record.geometry);
    }
    if (record.type === 'Polygon') {
      return normalizeBoundary(record.coordinates);
    }
    if (record.type === 'MultiPolygon' && Array.isArray(record.coordinates)) {
      return normalizeBoundary(record.coordinates[0]);
    }
    if ('coordinates' in record) {
      return normalizeBoundary(record.coordinates);
    }
  }

  if (!Array.isArray(value) || value.length === 0) return null;

  const firstRing = normalizeRing(value);
  if (firstRing) return [firstRing];

  const rings = value
    .map(normalizeRing)
    .filter((ring): ring is GeoCoord[] => ring !== null);

  return rings.length > 0 ? rings : null;
}

export function normalizeSettings(value: unknown, fallback: AppSettings = DEFAULT_APP_SETTINGS): AppSettings {
  const record = asRecord(value) ?? {};
  return {
    village_name: stringValue(record.village_name, fallback.village_name),
    district_name: stringValue(record.district_name, fallback.district_name),
    city_name: stringValue(record.city_name, fallback.city_name),
    province_name: stringValue(record.province_name, fallback.province_name),
    center_lat: coordinateNumber(record.center_lat, fallback.center_lat, -90, 90),
    center_lng: coordinateNumber(record.center_lng, fallback.center_lng, -180, 180),
    boundary_geojson: normalizeBoundary(record.boundary_geojson),
    fallback_radius_m: Math.max(100, Math.round(finiteNumber(record.fallback_radius_m, fallback.fallback_radius_m))),
  };
}

export function boundaryToLeafletPositions(boundary: GeoBoundary | null): [number, number][] | null {
  const ring = boundary?.[0];
  if (!ring || ring.length < 4) return null;
  return ring.slice(0, -1).map(([lng, lat]) => [lat, lng]);
}

export function getBoundaryCenter(boundary: GeoBoundary | null): [number, number] | null {
  const points = boundaryToLeafletPositions(boundary);
  if (!points?.length) return null;

  const bounds = points.reduce(
    (acc, [lat, lng]) => ({
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat),
      minLng: Math.min(acc.minLng, lng),
      maxLng: Math.max(acc.maxLng, lng),
    }),
    {
      minLat: points[0][0],
      maxLat: points[0][0],
      minLng: points[0][1],
      maxLng: points[0][1],
    }
  );

  return [
    (bounds.minLat + bounds.maxLat) / 2,
    (bounds.minLng + bounds.maxLng) / 2,
  ];
}

export function createRadiusBoundary(center: [number, number], radiusM: number, segments = 48): GeoBoundary {
  const [lat, lng] = center;
  const safeRadius = Math.max(100, radiusM);
  const points = Array.from({ length: Math.max(12, segments) }, (_, index): GeoCoord => {
    const angle = (index / Math.max(12, segments)) * Math.PI * 2;
    const latOffset = (Math.sin(angle) * safeRadius) / 111320;
    const lngOffset = (Math.cos(angle) * safeRadius) / (111320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    return [lng + lngOffset, lat + latOffset];
  });

  return [[...points, points[0]]];
}

export function buildLocationQuery(settings: Pick<AppSettings, 'village_name' | 'district_name' | 'city_name' | 'province_name'>) {
  return [
    settings.village_name,
    settings.district_name,
    settings.city_name,
    settings.province_name,
    'Indonesia',
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}
