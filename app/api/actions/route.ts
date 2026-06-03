/**
 * app/api/actions/route.ts
 * GET: List community actions. POST: Create a new action.
 */
import { NextRequest, NextResponse } from 'next/server';
import { insertRow, jsonError, listRows, updateRow, deleteRow } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  const actions = await listRows('community_actions', [], {
    filters: { status, category },
    order: { column: 'date', ascending: true },
  });

  return NextResponse.json(actions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, category, location, date, time, max_participants } = body;
  if (!title || !date) return jsonError('Missing required fields', 400);

  const fallback = {
    id: `act-${Date.now()}`,
    title,
    description,
    category,
    location,
    date,
    time,
    max_participants: Number(max_participants ?? 20),
    current_participants: Number(body.current_participants ?? 0),
    organizer: body.organizer ?? 'Admin Desa',
    image_url: body.image_url ?? 'https://picsum.photos/seed/action-new/800/400',
    status: body.status ?? 'open',
    report_id: body.report_id ?? null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('community_actions', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing action id', 400);

  const { data, error } = await updateRow('community_actions', id, updates, { id, ...updates });
  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing action id', 400);

  const { error } = await deleteRow('community_actions', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
