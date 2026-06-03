import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const announcements = await listRows('announcements', [], {
    filters: { category },
    order: { column: 'date', ascending: false },
  });

  return NextResponse.json(announcements);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title ?? '').trim();

  if (!title) return jsonError('Judul pengumuman wajib diisi.', 400);

  const fallback = {
    id: `announcement-${Date.now()}`,
    title,
    category: body.category ?? 'Umum',
    content: body.content ?? '',
    date: body.date ?? new Date().toISOString(),
    is_important: body.is_important ?? false,
  };

  const { data, error } = await insertRow('announcements', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing announcement id', 400);

  const { data, error } = await updateRow('announcements', id, updates, { id, ...updates });
  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing announcement id', 400);

  const { error } = await deleteRow('announcements', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
