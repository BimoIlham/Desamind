import { NextRequest, NextResponse } from 'next/server';
import { insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const limit = searchParams.get('limit');

  const reports = await listRows('reports', [], {
    filters: { status, category },
    order: { column: 'created_at', ascending: false },
    limit: limit ? Number(limit) : undefined,
  });

  return NextResponse.json(reports);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, category } = body;

  if (!title || !description || !category) {
    return jsonError('Judul, deskripsi, dan kategori wajib diisi.', 400);
  }

  const fallback = {
    id: `report-${Date.now()}`,
    user_id: body.user_id ?? 'anonymous',
    author_name: body.author_name ?? 'Warga Anonim',
    title,
    description,
    category,
    status: 'pending',
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    image_url: body.image_url ?? null,
    upvotes: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('reports', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('ID laporan wajib diisi.', 400);

  const { data, error } = await updateRow('reports', id, updates, {
    id,
    ...updates,
  });

  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}
