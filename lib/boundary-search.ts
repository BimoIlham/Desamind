import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  getBoundaryCenter,
  normalizeBoundary,
  type GeoBoundary,
} from '@/lib/map-settings';

export type BoundaryIdentity = {
  village_name: string;
  district_name: string;
  city_name: string;
  province_name: string;
};

export type BoundaryRegionLevel = 'province' | 'regency' | 'district' | 'village';

export type OfficialBoundaryCandidate = {
  lat: number;
  lng: number;
  displayName: string;
  source: 'local_geojson';
  sourceLabel: string;
  boundary: GeoBoundary;
  score: number;
  region?: {
    code?: string;
    name: string;
    level: BoundaryRegionLevel;
    village_name?: string;
    district_name?: string;
    city_name?: string;
    province_name?: string;
  };
};

type GeoJsonFeature = {
  type?: string;
  properties?: Record<string, unknown> | null;
  geometry?: unknown;
};

const PROPERTY_ALIASES = {
  village: [
    'village',
    'desa',
    'kelurahan',
    'nama_desa',
    'nam_desa',
    'wadmkd',
    'nmdesa',
    'namobj',
  ],
  district: [
    'district',
    'kecamatan',
    'nama_kecamatan',
    'nam_kec',
    'wadmkc',
    'nmkec',
  ],
  city: [
    'city',
    'regency',
    'kabupaten',
    'kota',
    'nama_kabupaten',
    'nama_kota',
    'nam_kab',
    'wadmkk',
    'nmkab',
  ],
  province: [
    'province',
    'provinsi',
    'nama_provinsi',
    'nam_prov',
    'wadmpr',
    'nmprov',
  ],
  code: [
    'code',
    'kode',
    'kode_desa',
    'kode_kec',
    'kode_kab',
    'kode_prov',
    'kdppum',
    'kdpkab',
    'kdcpum',
    'kdepum',
  ],
};

let localDatasetCache: GeoJsonFeature[] | null = null;

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(desa|kelurahan|kecamatan|kabupaten|kota|provinsi|regency|district|province|kec|kab)\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = normalizeText(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function stringValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function propValue(properties: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = new Set(aliases.map((alias) => alias.toLowerCase()));

  for (const [key, value] of Object.entries(properties)) {
    if (normalizedAliases.has(key.toLowerCase())) {
      const text = stringValue(value);
      if (text) return text;
    }
  }

  return '';
}

function allPropertyText(properties: Record<string, unknown>) {
  return Object.values(properties)
    .map(stringValue)
    .filter(Boolean)
    .join(' ');
}

function scoreCorpus({
  corpus,
  name,
  level,
  identity,
}: {
  corpus: string;
  name: string;
  level: BoundaryRegionLevel;
  identity: BoundaryIdentity;
}) {
  const normalizedName = normalizeText(name);
  const terms = [
    { value: identity.village_name, weight: 44 },
    { value: identity.district_name, weight: 38 },
    { value: identity.city_name, weight: 28 },
    { value: identity.province_name, weight: 20 },
  ];

  let score = 0;

  for (const term of terms) {
    const normalized = normalizeText(term.value);
    if (!normalized) continue;
    score += corpus.includes(normalized) ? term.weight : -term.weight;
    if (normalizedName === normalized) score += Math.round(term.weight * 0.8);
  }

  if (identity.village_name && level === 'village') score += 18;
  if (!identity.village_name && identity.district_name && level === 'district') score += 18;
  if (!identity.village_name && !identity.district_name && level === 'district') score += 12;
  if (!identity.village_name && !identity.district_name && level === 'village') score += 6;

  return score;
}

function regionLevelFromLocal(properties: Record<string, unknown>): BoundaryRegionLevel {
  if (propValue(properties, PROPERTY_ALIASES.village)) return 'village';
  if (propValue(properties, PROPERTY_ALIASES.district)) return 'district';
  if (propValue(properties, PROPERTY_ALIASES.city)) return 'regency';
  return 'province';
}

function regionFromLocalFeature(properties: Record<string, unknown>) {
  const level = regionLevelFromLocal(properties);
  const village = propValue(properties, PROPERTY_ALIASES.village);
  const district = propValue(properties, PROPERTY_ALIASES.district);
  const city = propValue(properties, PROPERTY_ALIASES.city);
  const province = propValue(properties, PROPERTY_ALIASES.province);
  const name = level === 'village'
    ? village
    : level === 'district'
      ? district
      : level === 'regency'
        ? city
        : province;

  return {
    code: propValue(properties, PROPERTY_ALIASES.code) || undefined,
    name: name || propValue(properties, ['name', 'nama', 'namobj']) || 'Wilayah',
    level,
    village_name: village || undefined,
    district_name: district || undefined,
    city_name: city || undefined,
    province_name: province || undefined,
  };
}

function displayName(parts: Array<string | undefined>) {
  return uniqueStrings(parts.filter(Boolean) as string[]).join(', ');
}

function extractFeatures(value: unknown): GeoJsonFeature[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;

  if (record.type === 'FeatureCollection' && Array.isArray(record.features)) {
    return record.features.flatMap(extractFeatures);
  }

  if (record.type === 'Feature') {
    return [record as GeoJsonFeature];
  }

  if (record.type === 'Polygon' || record.type === 'MultiPolygon') {
    return [{ type: 'Feature', properties: {}, geometry: value }];
  }

  return [];
}

async function listGeoJsonFiles(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) return listGeoJsonFiles(fullPath);
      return /\.(geojson|json)$/i.test(entry.name) ? [fullPath] : [];
    }));
    return nested.flat();
  } catch {
    return [];
  }
}

async function loadLocalDataset() {
  if (localDatasetCache) return localDatasetCache;

  const roots = [
    path.join(process.cwd(), 'data', 'boundaries'),
    path.join(process.cwd(), 'public', 'boundaries'),
  ];

  const files = (await Promise.all(roots.map(listGeoJsonFiles))).flat();
  const loaded = await Promise.all(files.map(async (filePath) => {
    try {
      const text = await readFile(filePath, 'utf8');
      return extractFeatures(JSON.parse(text));
    } catch {
      return [];
    }
  }));

  localDatasetCache = loaded.flat();
  return localDatasetCache;
}

async function searchLocalGeoJson(identity: BoundaryIdentity): Promise<OfficialBoundaryCandidate[]> {
  const features = await loadLocalDataset();
  if (!features.length) return [];

  return features.flatMap((feature) => {
    const properties = (feature.properties ?? {}) as Record<string, unknown>;
    const boundary = normalizeBoundary(feature);
    if (!boundary) return [];

    const region = regionFromLocalFeature(properties);
    const label = displayName([
      region.name,
      region.district_name,
      region.city_name,
      region.province_name,
      'Indonesia',
    ]);
    const corpus = normalizeText(`${label} ${allPropertyText(properties)}`);
    const score = scoreCorpus({
      corpus,
      name: region.name,
      level: region.level,
      identity,
    }) + 40;

    if (score < 65) return [];

    const center = getBoundaryCenter(boundary);
    if (!center) return [];

    return [{
      lat: center[0],
      lng: center[1],
      displayName: label || region.name,
      source: 'local_geojson' as const,
      sourceLabel: 'Dataset GeoJSON lokal',
      boundary,
      score,
      region,
    }];
  }).sort((a, b) => b.score - a.score);
}

export async function searchOfficialBoundaries({
  identity,
}: {
  identity: BoundaryIdentity;
}) {
  return searchLocalGeoJson(identity);
}

export function applyRegionToIdentity(
  identity: BoundaryIdentity,
  region: OfficialBoundaryCandidate['region'] | undefined
): BoundaryIdentity {
  if (!region) return identity;

  const mainName = region.village_name ?? region.name;
  const districtName = region.district_name ?? region.name;
  const cityName = region.city_name ?? identity.city_name;
  const provinceName = region.province_name ?? identity.province_name;

  return {
    village_name: mainName || identity.village_name,
    district_name: districtName || identity.district_name,
    city_name: cityName || identity.city_name,
    province_name: provinceName || identity.province_name,
  };
}
