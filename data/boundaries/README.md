# Boundary GeoJSON datasets

Place official administrative boundary datasets here when you have them.

Supported files:

- `*.geojson`
- `*.json` containing a GeoJSON `FeatureCollection`

The lookup code reads common Indonesian boundary property names, including:

- `nama_desa`, `WADMKD`, `NAMOBJ`
- `nama_kecamatan`, `WADMKC`
- `nama_kabupaten`, `WADMKK`
- `nama_provinsi`, `WADMPR`

When a matching local feature is found, it is preferred over external geocoding
fallbacks and is stored as `boundary_geojson` in `app_settings`.

