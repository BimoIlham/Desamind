import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const gallery = await listRows('gallery', [], {
    filters: { category },
    order: { column: 'date', ascending: false },
  });

  return NextResponse.json(gallery);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title ?? '').trim();

  if (!title) return jsonError('Judul galeri wajib diisi.', 400);

  const fallback = {
    id: `gallery-${Date.now()}`,
    title,
    category: body.category ?? 'Lainnya',
    date: body.date ?? new Date().toISOString().slice(0, 10),
    image_url: body.image_url ?? '',
  };

  const { data, error } = await insertRow('gallery', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing gallery id', 400);

  const { data, error } = await updateRow('gallery', id, updates, { id, ...updates });
  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing gallery id', 400);

  const { error } = await deleteRow('gallery', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
