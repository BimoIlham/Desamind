/**
 * app/api/settings/route.ts
 * GET  — Fetch the singleton app_settings row.
 * POST — Upsert the singleton app_settings row (admin only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { DEFAULT_APP_SETTINGS, SETTINGS_ROW_ID, normalizeSettings } from '@/lib/map-settings';

export async function GET() {
  const sb = getSupabaseServerClient();
  if (!sb) return NextResponse.json(DEFAULT_APP_SETTINGS);

  try {
    const { data: primary, error: primaryError } = await sb
      .from('app_settings')
      .select('*')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (primaryError) {
      console.warn('[API] Failed to fetch primary settings:', primaryError);
      return NextResponse.json(DEFAULT_APP_SETTINGS);
    }

    if (primary) return NextResponse.json(normalizeSettings(primary));

    const { data: latest, error: latestError } = await sb
      .from('app_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.warn('[API] Failed to fetch latest settings:', latestError);
      return NextResponse.json(DEFAULT_APP_SETTINGS);
    }

    return NextResponse.json(normalizeSettings(latest ?? DEFAULT_APP_SETTINGS));
  } catch (error) {
    console.warn('[API] Failed to fetch settings:', error);
    return NextResponse.json(DEFAULT_APP_SETTINGS);
  }
}

export async function POST(req: NextRequest) {
  const sb = getSupabaseServerClient();
  if (!sb) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const body = await req.json();
  const settings = normalizeSettings(body);

  const payload = {
    id: SETTINGS_ROW_ID,
    village_name: settings.village_name,
    district_name: settings.district_name,
    city_name: settings.city_name,
    province_name: settings.province_name,
    center_lat: settings.center_lat,
    center_lng: settings.center_lng,
    boundary_geojson: settings.boundary_geojson,
    fallback_radius_m: settings.fallback_radius_m,
    updated_at:        new Date().toISOString(),
  };

  try {
    const { data, error } = await sb
      .from('app_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(normalizeSettings(data));
  } catch (error) {
    console.warn('[API] Failed to save settings:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan.' }, { status: 500 });
  }
}
