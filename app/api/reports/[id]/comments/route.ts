import { NextRequest, NextResponse } from 'next/server';
import { insertRow, jsonError, listRows } from '@/lib/api-helpers';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await listRows('comments', [], {
    filters: { report_id: id },
    order: { column: 'created_at', ascending: true },
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const content = String(body.content ?? '').trim();

  if (!content) return jsonError('Komentar tidak boleh kosong.', 400);

  const fallback = {
    id: `comment-${Date.now()}`,
    report_id: id,
    user_id: body.user_id ?? 'anonymous',
    author_name: body.author_name ?? 'Warga',
    content,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('comments', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(data, { status: 201 });
}
