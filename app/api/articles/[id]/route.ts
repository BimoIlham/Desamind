import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, getRowById, jsonError, updateRow } from '@/lib/api-helpers';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getRowById('articles', id);

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await request.json();
  const { data, error } = await updateRow('articles', id, updates, { id, ...updates });

  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await deleteRow('articles', id);

  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
