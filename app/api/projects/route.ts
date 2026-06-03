/**
 * app/api/projects/route.ts
 * GET: List government projects. POST: Create a project (admin).
 */
import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');

  const projects = await listRows('projects', [], {
    filters: { category, status },
    order: { column: 'created_at', ascending: false },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, budget, category, start_date, end_date, contractor } = body;
  if (!title || !budget) return jsonError('Missing required fields', 400);

  const fallback = {
    id: `proj-${Date.now()}`,
    title,
    description,
    budget: Number(budget),
    spent: Number(body.spent ?? 0),
    progress: Number(body.progress ?? 0),
    status: body.status ?? 'planning',
    category: category ?? 'Infrastruktur',
    image_url: body.image_url ?? 'https://picsum.photos/seed/proj-new/800/400',
    start_date: start_date ?? null,
    end_date: end_date ?? null,
    contractor: contractor ?? null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('projects', fallback, fallback);
  if (error) return jsonError(error.message);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing project id', 400);

  const { data, error } = await updateRow('projects', id, updates, { id, ...updates });
  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing project id', 400);

  const { error } = await deleteRow('projects', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
