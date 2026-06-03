/**
 * app/api/reports/[id]/route.ts
 * GET: Single report details. PATCH: Update report status (admin).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getRowById, jsonError, updateRow } from '@/lib/api-helpers';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getRowById('reports', id);

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const VALID_STATUSES = ['pending', 'in_progress', 'completed'];
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const fallback = { id, status, updated_at: new Date().toISOString() };
  const { data, error } = await updateRow('reports', id, { status }, fallback);

  if (error) return jsonError(error.message);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('report_status_history').insert({
      report_id: id,
      status,
      note: body.note ?? `Status laporan diubah menjadi ${status}.`,
      changed_by: body.changed_by ?? 'Admin Desa',
    });
  }

  return NextResponse.json(data);
}
