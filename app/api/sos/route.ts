/**
 * app/api/sos/route.ts
 * POST: Create a new emergency (SOS) alert.
 * Persists to Supabase and falls back to mock response.
 */
import { NextRequest, NextResponse } from 'next/server';
import { insertRow, jsonError, listRows } from '@/lib/api-helpers';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  const alerts = await listRows('emergency_alerts', [], {
    order: { column: 'created_at', ascending: false },
  });

  return NextResponse.json(alerts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, description, location, lat, lng, user_id } = body;

  if (!type || !description) {
    return jsonError('Missing required fields', 400);
  }

  const fallback = {
    id: `sos-${Date.now()}`,
    type,
    description,
    location,
    lat: lat ?? null,
    lng: lng ?? null,
    user_id: user_id ?? 'anonymous',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('emergency_alerts', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  if (!id) return jsonError('ID alert wajib diisi.', 400);
  if (!status) return jsonError('Status wajib diisi.', 400);

  // emergency_alerts has no updated_at column, so update directly
  const supabase = getSupabaseServerClient();
  if (!supabase) return jsonError('Database is not configured');

  const { data, error } = await supabase
    .from('emergency_alerts')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing alert id', 400);

  const supabase = getSupabaseServerClient();
  if (!supabase) return jsonError('Database is not configured');

  const { error } = await supabase.from('emergency_alerts').delete().eq('id', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
