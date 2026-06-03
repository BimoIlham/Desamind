'use client';
/**
 * components/map/MapView.tsx — Interactive Map v3
 * Centered on Labuhan Maringgai, Lampung Timur.
 * Features: tile layer switcher, animated pulsing markers,
 *   live Supabase report data, rich popups, and mini stats bar.
 * MUST be loaded via dynamic import with { ssr: false }.
 */
import { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polygon,
  ZoomControl,
  ScaleControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchJson } from '@/lib/api-client';
import { fetchSettings } from '@/lib/geofence';
import {
  boundaryToLeafletPositions,
  DEFAULT_APP_SETTINGS,
  MAP_TILE_LAYERS,
  type MapLayerKey,
} from '@/lib/map-settings';


// ─── Constants (defaults, overridden by DB) ───────────────────
const DEFAULT_CENTER: [number, number] = [DEFAULT_APP_SETTINGS.center_lat, DEFAULT_APP_SETTINGS.center_lng];
const DEFAULT_ZOOM = 14;

// ─── Fix Leaflet icon path in Next.js ─────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Status colours ───────────────────────────────────────────
const STATUS_META: Record<string, { color: string; light: string; label: string; emoji: string }> = {
  pending:     { color: '#ef4444', light: '#fee2e2', label: 'Menunggu',  emoji: '!' },
  in_progress: { color: '#f59e0b', light: '#fef3c7', label: 'Diproses', emoji: '↑' },
  completed:   { color: '#22c55e', light: '#dcfce7', label: 'Selesai',  emoji: '✓' },
};
const CATEGORY_ICONS: Record<string, string> = {
  Infrastruktur: '🏗️', Banjir: '🌊', Sampah: '🗑️',
  Keamanan: '🛡️', Kesehatan: '🏥', Pendidikan: '📚',
  Lainnya: '📌',
};

// ─── Animated Marker Icon ─────────────────────────────────────
function createMarkerIcon(status: string, category: string) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const emoji = CATEGORY_ICONS[category] ?? '📌';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <!-- Pulsing ring -->
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${meta.color}22;
          animation:pulse 2s ease-out infinite;
        "></div>
        <!-- Outer ring -->
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:${meta.color}33;
        "></div>
        <!-- Core dot -->
        <div style="
          position:absolute;inset:8px;border-radius:50%;
          background:${meta.color};
          border:2px solid white;
          box-shadow:0 2px 8px ${meta.color}88;
          display:flex;align-items:center;justify-content:center;
          font-size:9px;color:white;font-weight:900;
        ">${meta.emoji}</div>
        <!-- Category emoji badge -->
        <div style="
          position:absolute;top:-6px;right:-6px;
          width:18px;height:18px;border-radius:50%;
          background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);
          display:flex;align-items:center;justify-content:center;
          font-size:9px;line-height:1;
        ">${emoji}</div>
      </div>
      <style>@keyframes pulse{0%{transform:scale(1);opacity:.8}70%{transform:scale(2.2);opacity:0}100%{transform:scale(1);opacity:0}}</style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
}

// ─── Dynamic Village boundary polygon ─────────────────────────
function createVillageCenterIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:44px;height:48px;">
        <div style="
          position:absolute;left:14px;bottom:4px;width:16px;height:16px;
          background:#f59e0b;transform:rotate(45deg);border-radius:4px;
          box-shadow:0 4px 12px rgba(15,23,42,.28);
        "></div>
        <div style="
          position:absolute;left:2px;top:0;width:40px;height:40px;border-radius:9999px;
          background:#1e3a5f;border:3px solid white;
          box-shadow:0 4px 14px rgba(30,58,95,.42);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 21h18"></path>
            <path d="M5 21V10"></path>
            <path d="M19 21V10"></path>
            <path d="M9 21V10"></path>
            <path d="M15 21V10"></path>
            <path d="M12 3 3 8h18z"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 48],
    iconAnchor: [22, 44],
    popupAnchor: [0, -42],
  });
}

function VillageBoundary({ coords }: { coords: [number, number][] | null }) {
  if (!coords || coords.length < 3) return null;
  return (
    <Polygon
      positions={coords}
      pathOptions={{
        color: '#1e3a5f',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#1e3a5f',
        fillOpacity: 0.04,
      }}
    />
  );
}

// ─── Fly to center ───────────────────────────────────────────
function SyncMapView({
  center,
  boundary,
}: {
  center: [number, number];
  boundary: [number, number][] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (boundary && boundary.length >= 3) {
      const bounds = L.latLngBounds(boundary);
      if (bounds.pad(0.35).contains(L.latLng(center))) {
        map.fitBounds(bounds, {
          animate: true,
          duration: 0.8,
          padding: [36, 36],
          maxZoom: 16,
        });
        return;
      }
    }

    map.flyTo(center, DEFAULT_ZOOM, { duration: 0.8 });
  }, [map, center, boundary]);
  return null;
}

// ─── Tile layer definitions ───────────────────────────────────
const TILE_LAYERS = MAP_TILE_LAYERS;
type LayerKey = MapLayerKey;

// ─── Types ────────────────────────────────────────────────────
type MapReport = {
  id: string; title: string; description: string | null;
  category: string; status: string; lat: number | null; lng: number | null;
  author_name: string; created_at: string;
};

// ─── Main Component ───────────────────────────────────────────
export default function MapView() {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [layer, setLayer] = useState<LayerKey>('street');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [boundaryCoords, setBoundaryCoords] = useState<[number, number][] | null>(null);
  const [villageName, setVillageName] = useState(DEFAULT_APP_SETTINGS.village_name);
  const [villageInfo, setVillageInfo] = useState({
    district: DEFAULT_APP_SETTINGS.district_name,
    city: DEFAULT_APP_SETTINGS.city_name,
    province: DEFAULT_APP_SETTINGS.province_name,
  });

  useEffect(() => {
    let mounted = true;
    fetchJson<MapReport[]>('/api/reports', []).then((data) => {
      if (!mounted) return;
      setReports(
        data
          .filter((report) => report.lat != null && report.lng != null)
          .map((report) => ({ ...report, lat: Number(report.lat), lng: Number(report.lng) }))
      );
    });
    fetchSettings({ refresh: true }).then((settings) => {
      if (!mounted) return;
      setMapCenter([settings.center_lat, settings.center_lng]);
      setVillageName(settings.village_name);
      setVillageInfo({
        district: settings.district_name,
        city: settings.city_name,
        province: settings.province_name,
      });
      setBoundaryCoords(boundaryToLeafletPositions(settings.boundary_geojson));
    });
    return () => { mounted = false; };
  }, []);



  const visible = useMemo(
    () => reports.filter(r => filterStatus === 'all' || r.status === filterStatus),
    [reports, filterStatus]
  );

  const stats = useMemo(() => ({
    total: reports.length,
    pending:     reports.filter(r => r.status === 'pending').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    completed:   reports.filter(r => r.status === 'completed').length,
  }), [reports]);

  const tl = TILE_LAYERS[layer];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* ── Filter bar ─────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 'calc(24px + env(safe-area-inset-bottom))', 
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', 
        gap: 6, background: 'white', width: 'max-content', maxWidth: 'calc(100% - 32px)',
        borderRadius: 20, padding: '8px 12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {[
          { key: 'all',         label: `Semua (${stats.total})`, color: '#1e3a5f' },
          { key: 'pending',     label: `Menunggu (${stats.pending})`,     color: '#ef4444' },
          { key: 'in_progress', label: `Diproses (${stats.in_progress})`, color: '#f59e0b' },
          { key: 'completed',   label: `Selesai (${stats.completed})`,    color: '#22c55e' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: 'pointer',
              background: filterStatus === f.key ? f.color : 'transparent',
              color: filterStatus === f.key ? 'white' : '#6b7280',
              transition: 'all .2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Leaflet Map ─────────────────────────────────────── */}
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        {/* Attribution custom position */}
        <div
          className="leaflet-bottom leaflet-right"
          style={{ marginBottom: 40 }}
        />

        <TileLayer
          key={layer}
          url={tl.url}
          attribution={tl.attribution}
          maxZoom={tl.maxZoom}
        />

        {/* Custom controls */}
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" imperial={false} />

        {/* Follow the admin-configured center and boundary. */}
        <SyncMapView center={mapCenter} boundary={boundaryCoords} />

        {/* Village boundary polygon (from admin settings) */}
        <VillageBoundary coords={boundaryCoords} />

        {/* Layer switcher — inside map's DOM */}
        <LayerSwitcherPortal active={layer} onChange={setLayer} />

        {/* Village center marker */}
        <Marker
          position={mapCenter}
          icon={createVillageCenterIcon()}
        >
          <Popup>
            <div style={{ minWidth: 200, padding: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#1e3a5f', marginBottom: 4 }}>
                🏛️ {villageName}
              </p>
              <p style={{ fontSize: 11, color: '#6b7280' }}>Kec. {villageInfo.district}, {villageInfo.city}</p>
              <p style={{ fontSize: 11, color: '#6b7280' }}>Provinsi {villageInfo.province}, Indonesia</p>
            </div>
          </Popup>
        </Marker>

        {/* Report markers */}
        {visible.map(report => (
          report.lat != null && report.lng != null ? (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={createMarkerIcon(report.status, report.category)}
            >
              <Popup minWidth={220} maxWidth={280}>
                <div style={{ padding: '4px 2px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, letterSpacing: '.5px',
                      background: STATUS_META[report.status]?.light ?? '#f3f4f6',
                      color: STATUS_META[report.status]?.color ?? '#374151',
                    }}>{STATUS_META[report.status]?.label ?? report.status}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 20, background: '#f3f4f6', color: '#374151',
                    }}>{report.category}</span>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 4, lineHeight: 1.3 }}>
                    {report.title}
                  </h4>
                  {report.description && (
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, lineHeight: 1.5 }}
                      className="line-clamp-2">
                      {report.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>👤 {report.author_name}</span>
                    <a href={`/laporan/${report.id}`}
                      style={{
                        fontSize: 11, fontWeight: 700, color: '#1e3a5f',
                        textDecoration: 'none', padding: '3px 10px',
                        background: '#eff6ff', borderRadius: 8,
                      }}>
                      Detail →
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}

/** Render layer switcher using a Leaflet Control Portal */
function LayerSwitcherPortal({ active, onChange }: { active: LayerKey; onChange: (k: LayerKey) => void }) {
  const map = useMap();
  useEffect(() => {
    const div = L.DomUtil.create('div');
    div.style.cssText = 'position:absolute;top:80px;right:10px;z-index:1000;display:flex;flex-direction:column;gap:4px;';
    (Object.keys(TILE_LAYERS) as LayerKey[]).forEach(k => {
      const btn = L.DomUtil.create('button', '', div);
      btn.textContent = TILE_LAYERS[k].label;
      btn.style.cssText = `
        padding:5px 10px;background:${active === k ? '#1e3a5f' : 'white'};
        color:${active === k ? 'white' : '#374151'};border:1px solid #e5e7eb;
        border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;
        box-shadow:0 1px 4px rgba(0,0,0,.1);margin:0;
      `;
      L.DomEvent.on(btn, 'click', () => onChange(k));
      L.DomEvent.disableClickPropagation(btn);
    });
    map.getContainer().appendChild(div);
    return () => { div.parentNode?.removeChild(div); };
  }, [map, active, onChange]);
  return null;
}
