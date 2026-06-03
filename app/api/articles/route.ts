import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const is_published = searchParams.get('is_published');

  const articles = await listRows('articles', [], {
    filters: {
      category,
      is_published: is_published === null ? undefined : is_published === 'true',
    },
    order: { column: 'created_at', ascending: false },
  });

  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title ?? '').trim();

  if (!title) return jsonError('Judul artikel wajib diisi.', 400);

  const fallback = {
    id: `article-${Date.now()}`,
    title,
    excerpt: body.excerpt ?? '',
    content: body.content ?? body.excerpt ?? '',
    category: body.category ?? 'Umum',
    author: body.author ?? 'Admin DesaMind',
    image_url: body.image_url ?? null,
    is_published: body.is_published ?? true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('articles', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing article id', 400);

  const { data, error } = await updateRow('articles', id, updates, { id, ...updates });
  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing article id', 400);

  const { error } = await deleteRow('articles', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
