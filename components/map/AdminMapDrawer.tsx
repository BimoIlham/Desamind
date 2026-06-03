'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FeatureGroup,
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
  boundaryToLeafletPositions,
  MAP_TILE_LAYERS,
  normalizeBoundary,
  type GeoBoundary,
  type MapLayerKey,
} from '@/lib/map-settings';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Props {
  center: [number, number]; // [lat, lng]
  existingPolygon?: GeoBoundary | null;
  onCenterChange: (center: [number, number]) => void;
  onPolygonChange: (coords: GeoBoundary | null) => void;
}

function DrawControls({
  featureGroupRef,
  onPolygonChange,
}: {
  featureGroupRef: React.RefObject<L.FeatureGroup>;
  onPolygonChange: (coords: GeoBoundary | null) => void;
}) {
  const map = useMap();
  const drawRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    require('leaflet-draw');
    if (!featureGroupRef.current) return;

    if (drawRef.current) map.removeControl(drawRef.current);

    const drawControl = new (L.Control as any).Draw({
      edit: { featureGroup: featureGroupRef.current, remove: true },
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: '#1e3a5f', weight: 2, fillOpacity: 0.1 },
          showArea: true,
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
    });

    drawRef.current = drawControl;
    map.addControl(drawControl);

    function extractCoords(): GeoBoundary | null {
      if (!featureGroupRef.current) return null;
      const layers: L.Layer[] = [];
      featureGroupRef.current.eachLayer((layer) => layers.push(layer));
      if (layers.length === 0) return null;

      const latestPolygon = layers[layers.length - 1] as L.Polygon;
      const latLngs = latestPolygon.getLatLngs()[0] as L.LatLng[];
      const ring = latLngs.map((latLng) => [latLng.lng, latLng.lat]);
      return normalizeBoundary([ring]);
    }

    const onCreated: L.LeafletEventHandlerFn = (event) => {
      const layer = (event as L.LeafletEvent & { layer: L.Layer }).layer;
      featureGroupRef.current?.clearLayers();
      featureGroupRef.current?.addLayer(layer);
      onPolygonChange(extractCoords());
    };

    const onEdited: L.LeafletEventHandlerFn = () => {
      onPolygonChange(extractCoords());
    };

    const onDeleted: L.LeafletEventHandlerFn = () => {
      featureGroupRef.current?.clearLayers();
      onPolygonChange(null);
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, onEdited);
      map.off(L.Draw.Event.DELETED, onDeleted);
    };
  }, [featureGroupRef, map, onPolygonChange]);

  return null;
}

function SyncView({
  center,
  positions,
}: {
  center: [number, number];
  positions: [number, number][] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length >= 3) {
      const bounds = L.latLngBounds(positions);
      if (bounds.pad(0.35).contains(L.latLng(center))) {
        map.fitBounds(bounds, {
          animate: true,
          duration: 0.7,
          padding: [28, 28],
          maxZoom: 17,
        });
        return;
      }
    }

    map.flyTo(center, 14, { duration: 0.7 });
  }, [center, map, positions]);
  return null;
}

function CenterMarker({
  center,
  onCenterChange,
}: {
  center: [number, number];
  onCenterChange: (center: [number, number]) => void;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
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
      }),
    []
  );

  return (
    <Marker
      position={center}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const next = event.target.getLatLng();
          onCenterChange([next.lat, next.lng]);
        },
      }}
    />
  );
}

function LayerSwitcherControl({
  active,
  onChange,
}: {
  active: MapLayerKey;
  onChange: (layer: MapLayerKey) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const container = L.DomUtil.create('div');
    container.style.cssText = [
      'position:absolute',
      'top:12px',
      'right:12px',
      'z-index:1000',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
    ].join(';');

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    (Object.keys(MAP_TILE_LAYERS) as MapLayerKey[]).forEach((key) => {
      const layer = MAP_TILE_LAYERS[key];
      const button = L.DomUtil.create('button', '', container) as HTMLButtonElement;
      button.type = 'button';
      button.textContent = layer.label;
      button.title = `Tampilan ${layer.label}`;
      button.style.cssText = [
        'width:74px',
        'height:34px',
        'border-radius:8px',
        'border:1px solid rgba(15,23,42,.08)',
        'box-shadow:0 3px 10px rgba(15,23,42,.18)',
        'font-size:13px',
        'font-weight:700',
        'cursor:pointer',
        'transition:background .18s,color .18s,transform .18s',
        `background:${active === key ? '#1e3a5f' : '#ffffff'}`,
        `color:${active === key ? '#ffffff' : '#334155'}`,
      ].join(';');

      L.DomEvent.on(button, 'click', (event) => {
        L.DomEvent.stop(event);
        onChange(key);
      });
    });

    map.getContainer().appendChild(container);
    return () => {
      container.parentNode?.removeChild(container);
    };
  }, [active, map, onChange]);

  return null;
}

export default function AdminMapDrawer({ center, existingPolygon, onCenterChange, onPolygonChange }: Props) {
  const featureGroupRef = useRef<L.FeatureGroup>(null!);
  const [layer, setLayer] = useState<MapLayerKey>('satellite');
  const leafletPositions = useMemo(
    () => boundaryToLeafletPositions(normalizeBoundary(existingPolygon)),
    [existingPolygon]
  );
  const activeLayer = MAP_TILE_LAYERS[layer];

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <TileLayer
        key={layer}
        url={activeLayer.url}
        attribution={activeLayer.attribution}
        maxZoom={activeLayer.maxZoom}
      />
      <LayerSwitcherControl active={layer} onChange={setLayer} />
      <SyncView center={center} positions={leafletPositions} />
      <CenterMarker center={center} onCenterChange={onCenterChange} />

      <FeatureGroup ref={featureGroupRef}>
        <DrawControls featureGroupRef={featureGroupRef} onPolygonChange={onPolygonChange} />
        {leafletPositions && leafletPositions.length >= 3 && (
          <Polygon
            positions={leafletPositions}
            pathOptions={{ color: '#1e3a5f', weight: 2, dashArray: '6 4', fillOpacity: 0.1 }}
          />
        )}
      </FeatureGroup>
    </MapContainer>
  );
}
