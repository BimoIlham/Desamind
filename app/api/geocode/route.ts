import { NextRequest, NextResponse } from 'next/server';
import {
  createRadiusBoundary,
  getBoundaryCenter,
  normalizeBoundary,
  type GeoBoundary,
} from '@/lib/map-settings';
import {
  applyRegionToIdentity,
  searchOfficialBoundaries,
  type OfficialBoundaryCandidate,
} from '@/lib/boundary-search';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EXTERNAL_GEOCODER_TIMEOUT_MS = 7000;

type Identity = {
  village_name: string;
  district_name: string;
  city_name: string;
  province_name: string;
};

type BoundingBox = {
  south: number;
  north: number;
  west: number;
  east: number;
};

type Candidate = {
  lat: number;
  lng: number;
  display_name: string;
  source: 'wilayah_id' | 'local_geojson' | 'nominatim' | 'photon' | 'kodepos' | 'local';
  corpus: string;
  boundary: GeoBoundary | null;
  boundingBox: BoundingBox | null;
  score: number;
  isAdministrative: boolean;
  sourceLabel?: string;
  region?: OfficialBoundaryCandidate['region'];
};

type LocalFallback = {
  area: string;
  district?: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
  display_name: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: Record<string, string | undefined>;
  geojson?: unknown;
  boundingbox?: string[];
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: Record<string, string | number | boolean | null | undefined>;
};

const LOCAL_COORDINATE_FALLBACKS: LocalFallback[] = [
  {
    area: 'jati agung',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.3040773,
    lng: 105.336536,
    display_name: 'Jati Agung, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'bali agung',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6032,
    lng: 105.6593,
    display_name: 'Bali Agung, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'bandan hurip',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.599,
    lng: 105.7283,
    display_name: 'Bandan Hurip, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'bangunan',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6481,
    lng: 105.6675,
    display_name: 'Bangunan, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'bumi asih',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.5868,
    lng: 105.6358,
    display_name: 'Bumi Asih, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'bumi asri',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.5699,
    lng: 105.6349,
    display_name: 'Bumi Asri, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'bumi daya',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6204,
    lng: 105.6302,
    display_name: 'Bumi Daya, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'bumi restu',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.5821,
    lng: 105.6435,
    display_name: 'Bumi Restu, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'kalirejo',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6281,
    lng: 105.6567,
    display_name: 'Kalirejo, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'mekar mulya',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6143,
    lng: 105.6771,
    display_name: 'Mekar Mulya, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'palas aji',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6465,
    lng: 105.6934,
    display_name: 'Palas Aji, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'palas jaya',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6033,
    lng: 105.6963,
    display_name: 'Palas Jaya, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'palas pasemah',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6251,
    lng: 105.6926,
    display_name: 'Palas Pasemah, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'pematang baru',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6599,
    lng: 105.7,
    display_name: 'Pematang Baru, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'pulau jaya',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.5626,
    lng: 105.6584,
    display_name: 'Pulau Jaya, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'pulau tengah',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.601,
    lng: 105.7011,
    display_name: 'Pulau Tengah, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'rejo mulyo',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6335,
    lng: 105.6705,
    display_name: 'Rejo Mulyo, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'sukabakti',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6906,
    lng: 105.6906,
    display_name: 'Sukabakti, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'sukamulya',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6628219,
    lng: 105.6749539,
    display_name: 'Sukamulya, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'sukaraja',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6705,
    lng: 105.6796,
    display_name: 'Sukaraja, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'tanjung jaya',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.5908,
    lng: 105.6216,
    display_name: 'Tanjung Jaya, Palas, Lampung Selatan, Lampung, Indonesia',
  },
  {
    area: 'tanjung sari',
    district: 'palas',
    city: 'lampung selatan',
    province: 'lampung',
    lat: -5.6649,
    lng: 105.6552,
    display_name: 'Tanjung Sari, Palas, Lampung Selatan, Lampung, Indonesia',
  },
];

function readParam(request: NextRequest, key: keyof Identity) {
  return request.nextUrl.searchParams.get(key)?.trim() ?? '';
}

function readRadius(request: NextRequest) {
  const radius = Number(request.nextUrl.searchParams.get('radius_m'));
  return Number.isFinite(radius) ? Math.max(250, Math.min(20000, Math.round(radius))) : 2500;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(desa|kelurahan|kecamatan|kabupaten|kota|provinsi|regency|district|province|kec|kab)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compactText(value: string) {
  return normalizeText(value).replace(/\s+/g, '');
}

function rawSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripAdministrativeWords(value: string) {
  return value
    .replace(/\b(desa|kelurahan|kecamatan|kabupaten|kota|provinsi|kec|kab)\b\.?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasTerm(corpus: string, term: string) {
  const normalized = normalizeText(term);
  return !normalized || corpus.includes(normalized);
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const normalized = normalizeText(part);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function uniqueQueries(queries: string[]) {
  const seen = new Set<string>();
  return queries.filter((query) => {
    const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function prefixed(prefix: string, value: string) {
  if (!value.trim()) return '';
  return value.trim().toLowerCase().startsWith(prefix.toLowerCase())
    ? value
    : `${prefix} ${value}`;
}

function externalGeocoderSignal() {
  return AbortSignal.timeout(EXTERNAL_GEOCODER_TIMEOUT_MS);
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function placeSlugCandidates(value: string) {
  const stripped = stripAdministrativeWords(value);
  const raw = rawSlug(value);
  const clean = rawSlug(stripped || value);
  return uniqueStrings([
    clean,
    clean.replace(/-/g, ''),
    raw,
    raw.replace(/-/g, ''),
  ]);
}

function citySlugCandidates(value: string) {
  const stripped = stripAdministrativeWords(value);
  const raw = rawSlug(value);
  const clean = rawSlug(stripped || value);
  const alreadyPrefixed = raw.startsWith('kabupaten-') || raw.startsWith('kota-');

  return uniqueStrings([
    alreadyPrefixed ? raw : '',
    clean && `kabupaten-${clean}`,
    clean && `kota-${clean}`,
    clean,
    raw,
  ]);
}

function buildQueries(identity: Identity) {
  const strictParts = uniqueParts([
    identity.village_name && prefixed('Desa', identity.village_name),
    identity.district_name && prefixed('Kecamatan', identity.district_name),
    identity.city_name && prefixed('Kabupaten', identity.city_name),
    identity.province_name,
    'Indonesia',
  ]);

  const districtParts = uniqueParts([
    identity.district_name && prefixed('Kecamatan', identity.district_name),
    identity.city_name && prefixed('Kabupaten', identity.city_name),
    identity.province_name,
    'Indonesia',
  ]);

  const looseParts = uniqueParts([
    identity.village_name,
    identity.district_name,
    identity.city_name,
    identity.province_name,
    'Indonesia',
  ]);

  return uniqueQueries([
    strictParts.join(', '),
    districtParts.join(', '),
    looseParts.join(', '),
  ]);
}

function buildOfficeQueries(identity: Identity) {
  const parts = uniqueParts([
    identity.village_name,
    identity.district_name && prefixed('Kecamatan', identity.district_name),
    identity.city_name && prefixed('Kabupaten', identity.city_name),
    identity.province_name,
    'Indonesia',
  ]);
  const area = parts.join(', ');

  return uniqueQueries([
    identity.village_name && `Kantor Desa ${area}`,
    identity.village_name && `Balai Desa ${area}`,
    identity.village_name && `Kantor Kelurahan ${area}`,
    `Kantor ${area}`,
  ].filter(Boolean));
}

function matchesMainArea(candidate: Pick<Candidate, 'corpus'>, identity: Identity) {
  if (identity.village_name) return hasTerm(candidate.corpus, identity.village_name);
  if (identity.district_name) return hasTerm(candidate.corpus, identity.district_name);
  if (identity.city_name) return hasTerm(candidate.corpus, identity.city_name);
  return true;
}

function isOfficeCandidate(candidate: Pick<Candidate, 'corpus' | 'display_name'>, identity: Identity) {
  const corpus = `${candidate.corpus} ${normalizeText(candidate.display_name)}`;
  const officeKeyword = [
    'kantor desa',
    'balai desa',
    'kantor kelurahan',
    'kantor kepala desa',
    'village office',
  ].some((term) => corpus.includes(term));

  if (!officeKeyword) return false;
  if (identity.village_name && !hasTerm(corpus, identity.village_name)) return false;
  if (identity.district_name && !hasTerm(corpus, identity.district_name)) return false;
  return true;
}

function isNonVillagePoint(candidate: Pick<Candidate, 'corpus' | 'display_name'>, identity: Identity) {
  if (!identity.village_name || isOfficeCandidate(candidate, identity)) return false;

  const corpus = `${candidate.corpus} ${normalizeText(candidate.display_name)}`;
  return [
    'kantor kecamatan',
    'kantor camat',
    'puskesmas',
    'polsek',
    'sekolah',
    'upt',
    'bank',
    'kantor pos',
  ].some((term) => corpus.includes(term));
}

function scoreCandidate(candidate: Candidate, identity: Identity, meta: { kind?: string; importance?: number }) {
  const terms = [
    { value: identity.village_name, weight: 45 },
    { value: identity.district_name, weight: 35 },
    { value: identity.city_name, weight: 30 },
    { value: identity.province_name, weight: 20 },
  ];

  let score = 0;
  for (const term of terms) {
    if (!term.value) continue;
    score += hasTerm(candidate.corpus, term.value) ? term.weight : -term.weight;
  }

  if (!matchesMainArea(candidate, identity)) score -= 120;
  if (hasTerm(candidate.corpus, 'Indonesia')) score += 10;
  if (candidate.boundary) score += 30;
  if (meta.kind?.includes('boundary')) score += 20;
  if (meta.kind?.includes('administrative')) score += 20;
  if (['village', 'town', 'suburb', 'district', 'municipality', 'city'].some((kind) => meta.kind?.includes(kind))) {
    score += 12;
  }
  score += Math.round((meta.importance ?? 0) * 10);

  return score;
}

function parseBoundingBox(value: string[] | undefined): BoundingBox | null {
  if (!value || value.length < 4) return null;
  const [south, north, west, east] = value.map(Number);
  if ([south, north, west, east].some((item) => !Number.isFinite(item))) return null;
  return { south, north, west, east };
}

async function searchNominatim(query: string, identity: Identity): Promise<Candidate[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('polygon_geojson', '1');
  url.searchParams.set('limit', '10');
  url.searchParams.set('countrycodes', 'id');
  url.searchParams.set('q', query);

  try {
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      signal: externalGeocoderSignal(),
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'id,en',
        'User-Agent': 'DesaCerdas/1.0 admin-geocoder',
      },
    });

    if (!response.ok) return [];

    const results = (await response.json()) as NominatimResult[];
    return results.flatMap((result) => {
      const lat = Number(result.lat);
      const lng = Number(result.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

      const corpus = normalizeText([
        result.display_name,
        result.class,
        result.type,
        ...Object.values(result.address ?? {}),
      ].filter(Boolean).join(' '));

      const kind = `${result.class ?? ''} ${result.type ?? ''}`;
      const isAdministrative = result.class === 'boundary' || result.type === 'administrative';
      const boundary = isAdministrative ? normalizeBoundary(result.geojson) : null;
      const candidate: Candidate = {
        lat,
        lng,
        display_name: result.display_name ?? query,
        source: 'nominatim',
        corpus,
        boundary,
        boundingBox: parseBoundingBox(result.boundingbox),
        score: 0,
        isAdministrative,
      };
      candidate.score = scoreCandidate(candidate, identity, {
        kind,
        importance: result.importance,
      });
      return [candidate];
    });
  } catch {
    return [];
  }
}

async function searchPhoton(query: string, identity: Identity): Promise<Candidate[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '10');
  url.searchParams.set('lang', 'id');

  try {
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      signal: externalGeocoderSignal(),
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'id,en',
      },
    });

    if (!response.ok) return [];

    const data = await response.json() as { features?: PhotonFeature[] };
    return (data.features ?? []).flatMap((feature) => {
      const lng = feature.geometry?.coordinates?.[0];
      const lat = feature.geometry?.coordinates?.[1];
      if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return [];
      }

      const properties = feature.properties ?? {};
      const values = Object.values(properties)
        .filter((value): value is string | number | boolean => value !== null && value !== undefined)
        .map(String);
      const corpus = normalizeText(values.join(' '));
      const displayName = [
        properties.name,
        properties.city,
        properties.county,
        properties.state,
        properties.country,
      ].filter(Boolean).join(', ');

      const candidate: Candidate = {
        lat,
        lng,
        display_name: displayName || query,
        source: 'photon',
        corpus,
        boundary: null,
        boundingBox: null,
        score: 0,
        isAdministrative: false,
      };
      candidate.score = scoreCandidate(candidate, identity, {
        kind: `${properties.osm_key ?? ''} ${properties.osm_value ?? ''} ${properties.type ?? ''}`,
      });
      return [candidate];
    });
  } catch {
    return [];
  }
}

type KodeposUrlCandidate = {
  url: string;
  scope: 'district' | 'village';
};

function buildKodeposUrls(identity: Identity): KodeposUrlCandidate[] {
  if (!identity.province_name || !identity.city_name || !identity.district_name) return [];

  const provinceSlugs = placeSlugCandidates(identity.province_name).slice(0, 2);
  const citySlugs = citySlugCandidates(identity.city_name).slice(0, 4);
  const districtSlugs = placeSlugCandidates(identity.district_name).slice(0, 2);
  const villageSlugs = placeSlugCandidates(identity.village_name).slice(0, 3);
  const urls: KodeposUrlCandidate[] = [];

  for (const province of provinceSlugs) {
    for (const city of citySlugs) {
      for (const district of districtSlugs) {
        const base = `https://kodepos.co.id/kodepos/${province}/${city}/${district}`;
        urls.push({ url: base, scope: 'district' });

        for (const village of villageSlugs) {
          urls.push({ url: `${base}/${village}`, scope: 'village' });
        }
      }
    }
  }

  const seen = new Set<string>();
  return urls.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, 20);
}

async function fetchKodeposPage(url: string) {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: externalGeocoderSignal(),
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'id,en',
        'User-Agent': 'DesaCerdas/1.0 kodepos-geocoder',
      },
    });

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlToText(html: string) {
  return decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isIndonesiaCoordinate(lat: number, lng: number) {
  return lat >= -11.5 && lat <= 6.5 && lng >= 94 && lng <= 142;
}

function coordinateFromMatch(match: RegExpExecArray) {
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isIndonesiaCoordinate(lat, lng)) return null;
  return { lat, lng, index: match.index };
}

function findKodeposCoordinate(text: string, identity: Identity, scope: KodeposUrlCandidate['scope']) {
  const coordinatePattern = /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{2,3}(?:\.\d+)?)/g;
  const village = normalizeText(identity.village_name);
  const compactVillage = compactText(identity.village_name);
  const normalizedText = normalizeText(text);
  let firstCoordinate: { lat: number; lng: number; index: number } | null = null;
  let match: RegExpExecArray | null;

  while ((match = coordinatePattern.exec(text)) !== null) {
    const coordinate = coordinateFromMatch(match);
    if (!coordinate) continue;
    firstCoordinate ??= coordinate;

    const windowText = text.slice(Math.max(0, match.index - 180), match.index);
    const normalizedWindow = normalizeText(windowText);
    const compactWindow = compactText(windowText);
    if (
      village &&
      (normalizedWindow.includes(village) || compactWindow.includes(compactVillage))
    ) {
      return coordinate;
    }
  }

  if (
    scope === 'village' &&
    firstCoordinate &&
    village &&
    (normalizedText.includes(village) || compactText(text).includes(compactVillage))
  ) {
    return firstCoordinate;
  }

  return null;
}

function createKodeposCandidate(identity: Identity, coordinate: { lat: number; lng: number }, url: string): Candidate {
  const displayName = [
    identity.village_name,
    identity.district_name,
    identity.city_name,
    identity.province_name,
    'Indonesia',
  ].filter(Boolean).join(', ');

  const candidate: Candidate = {
    lat: coordinate.lat,
    lng: coordinate.lng,
    display_name: displayName,
    source: 'kodepos',
    corpus: normalizeText(`${displayName} kodepos ${url}`),
    boundary: null,
    boundingBox: null,
    score: 122,
    isAdministrative: false,
  };
  return candidate;
}

async function searchKodeposFallback(identity: Identity): Promise<Candidate[]> {
  if (!identity.village_name || !identity.district_name || !identity.city_name || !identity.province_name) {
    return [];
  }

  const urls = buildKodeposUrls(identity);
  const villageUrls = urls.filter((item) => item.scope === 'village').slice(0, 12);
  const districtUrls = compactText(identity.village_name) === compactText(identity.district_name)
    ? []
    : urls.filter((item) => item.scope === 'district').slice(0, 8);

  for (const group of [villageUrls, districtUrls]) {
    const pages = await Promise.all(group.map(async (item) => ({
      item,
      html: await fetchKodeposPage(item.url),
    })));

    for (const page of pages) {
      if (!page.html) continue;
      const text = htmlToText(page.html);
      const coordinate = findKodeposCoordinate(text, identity, page.item.scope);
      if (coordinate) return [createKodeposCandidate(identity, coordinate, page.item.url)];
    }
  }

  return [];
}

function searchLocalFallbacks(identity: Identity): Candidate[] {
  const mainTerms = [identity.village_name, identity.district_name].map(normalizeText).filter(Boolean);
  const district = normalizeText(identity.district_name);
  const city = normalizeText(identity.city_name);
  const province = normalizeText(identity.province_name);

  return LOCAL_COORDINATE_FALLBACKS.flatMap((fallback) => {
    const normalizedArea = normalizeText(fallback.area);
    const compactArea = compactText(fallback.area);
    const areaMatches = mainTerms.some((term) => term === normalizedArea || term.replace(/\s+/g, '') === compactArea);
    const districtMatches = !district || !('district' in fallback) || district === normalizeText(fallback.district ?? '');
    const cityMatches = !city || city === normalizeText(fallback.city);
    const provinceMatches = !province || province === normalizeText(fallback.province);
    if (!areaMatches || !districtMatches || !cityMatches || !provinceMatches) return [];

    const candidate: Candidate = {
      lat: fallback.lat,
      lng: fallback.lng,
      display_name: fallback.display_name,
      source: 'local',
      corpus: normalizeText([fallback.area, fallback.district, fallback.city, fallback.province, 'Indonesia'].filter(Boolean).join(' ')),
      boundary: null,
      boundingBox: null,
      score: 125,
      isAdministrative: false,
    };
    return [candidate];
  });
}

function officialBoundaryToCandidate(candidate: OfficialBoundaryCandidate, identity: Identity): Candidate {
  const appliedIdentity = applyRegionToIdentity(identity, candidate.region);
  return {
    lat: candidate.lat,
    lng: candidate.lng,
    display_name: candidate.displayName,
    source: candidate.source,
    sourceLabel: candidate.sourceLabel,
    corpus: normalizeText([
      candidate.displayName,
      candidate.region?.name,
      appliedIdentity.village_name,
      appliedIdentity.district_name,
      appliedIdentity.city_name,
      appliedIdentity.province_name,
      'Indonesia',
    ].filter(Boolean).join(' ')),
    boundary: candidate.boundary,
    boundingBox: null,
    score: candidate.score,
    isAdministrative: true,
    region: candidate.region,
  };
}

export async function GET(request: NextRequest) {
  const identity: Identity = {
    village_name: readParam(request, 'village_name'),
    district_name: readParam(request, 'district_name'),
    city_name: readParam(request, 'city_name'),
    province_name: readParam(request, 'province_name'),
  };
  const radiusM = readRadius(request);

  if (!identity.village_name && !identity.district_name && !identity.city_name) {
    return NextResponse.json({ error: 'Identitas wilayah belum lengkap.' }, { status: 400 });
  }

  try {
    const queries = buildQueries(identity);
    const candidates: Candidate[] = [];
    const officeCandidates: Candidate[] = [];

    const officialCandidates = (await searchOfficialBoundaries({ identity }))
      .map((candidate) => officialBoundaryToCandidate(candidate, identity));
    candidates.push(...officialCandidates);

    const bestOfficial = officialCandidates
      .filter((candidate) => matchesMainArea(candidate, identity))
      .sort((a, b) => b.score - a.score)[0];

    if (bestOfficial && bestOfficial.score >= 90) {
      const appliedIdentity = applyRegionToIdentity(identity, bestOfficial.region);
      return NextResponse.json({
        lat: bestOfficial.lat,
        lng: bestOfficial.lng,
        display_name: bestOfficial.display_name,
        boundary_geojson: bestOfficial.boundary,
        boundary_center: { lat: bestOfficial.lat, lng: bestOfficial.lng },
        boundary_precision: 'official',
        center_precision: 'area',
        bounding_box: bestOfficial.boundingBox,
        score: bestOfficial.score,
        source: bestOfficial.source,
        source_label: bestOfficial.sourceLabel,
        region: bestOfficial.region,
        identity: appliedIdentity,
      });
    }

    for (const query of queries) {
      candidates.push(...await searchNominatim(query, identity));
      if (candidates.some((candidate) => candidate.score >= 100 && candidate.boundary)) break;
    }

    const bestNominatim = candidates
      .filter((candidate) => matchesMainArea(candidate, identity))
      .sort((a, b) => b.score - a.score)[0];

    if (!bestNominatim || bestNominatim.score < 80) {
      for (const query of queries) {
        candidates.push(...await searchPhoton(query, identity));
      }
    }

    candidates.push(...searchLocalFallbacks(identity));

    const hasSpecificAreaCandidate = candidates
      .filter((candidate) => matchesMainArea(candidate, identity))
      .some((candidate) => candidate.score >= 80 && !isNonVillagePoint(candidate, identity));

    if (!hasSpecificAreaCandidate) {
      candidates.push(...await searchKodeposFallback(identity));
    }

    for (const query of buildOfficeQueries(identity)) {
      officeCandidates.push(...await searchNominatim(query, identity));
      if (officeCandidates.some((candidate) => isOfficeCandidate(candidate, identity))) break;
    }

    const bestBoundary = candidates
      .filter((candidate) => candidate.boundary && candidate.isAdministrative && matchesMainArea(candidate, identity))
      .sort((a, b) => b.score - a.score)[0];

    const bestOffice = officeCandidates
      .filter((candidate) => isOfficeCandidate(candidate, identity))
      .sort((a, b) => b.score - a.score)[0];

    const rankedAreaCandidates = candidates
      .filter((candidate) => matchesMainArea(candidate, identity))
      .sort((a, b) => b.score - a.score);
    const bestAreaPoint = rankedAreaCandidates.find((candidate) => !isNonVillagePoint(candidate, identity));

    const center = bestOffice ?? bestAreaPoint ?? bestBoundary;

    if (!center || center.score < 55) {
      return NextResponse.json({ error: 'Lokasi tidak ditemukan dengan cukup akurat.' }, { status: 404 });
    }

    const centerPoint: [number, number] = [center.lat, center.lng];
    const boundary = bestBoundary?.boundary ?? createRadiusBoundary(centerPoint, radiusM);
    const boundaryCenter = getBoundaryCenter(bestBoundary?.boundary ?? null);
    const lat = bestOffice ? bestOffice.lat : center.lat;
    const lng = bestOffice ? bestOffice.lng : center.lng;
    const appliedIdentity = applyRegionToIdentity(identity, bestBoundary?.region ?? center.region);

    return NextResponse.json({
      lat,
      lng,
      display_name: bestOffice
        ? bestOffice.display_name
        : center.display_name,
      boundary_geojson: boundary,
      boundary_center: boundaryCenter ? { lat: boundaryCenter[0], lng: boundaryCenter[1] } : null,
      boundary_precision: bestBoundary?.boundary ? 'official' : 'estimated_radius',
      center_precision: bestOffice ? 'office' : 'area',
      bounding_box: center.boundingBox,
      score: Math.max(center.score, bestBoundary?.score ?? 0),
      source: bestOffice?.source ?? center.source,
      source_label: bestBoundary?.sourceLabel ?? bestOffice?.sourceLabel ?? center.sourceLabel,
      region: bestBoundary?.region ?? center.region,
      identity: appliedIdentity,
    });
  } catch (error) {
    console.warn('[API] Geocode failed:', error);
    return NextResponse.json({ error: 'Gagal mencari koordinat wilayah.' }, { status: 502 });
  }
}
