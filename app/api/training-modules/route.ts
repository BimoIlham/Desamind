import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';
import { normalizeTrainingModule, normalizeTrainingModules } from '@/lib/training-modules';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const is_published = searchParams.get('is_published');

  const modules = await listRows('training_modules', [], {
    filters: {
      category,
      is_published: is_published === null ? undefined : is_published === 'true',
    },
    order: { column: 'created_at', ascending: false },
  });

  return NextResponse.json(normalizeTrainingModules(modules as any[]));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title ?? '').trim();

  if (!title) return jsonError('Judul modul wajib diisi.', 400);

  const fallback = {
    id: `module-${Date.now()}`,
    title,
    description: body.description ?? '',
    category: body.category ?? 'Umum',
    level: body.level ?? 'Pemula',
    duration_minutes: Number(body.duration_minutes ?? 60),
    image_url: body.image_url ?? null,
    instructor: body.instructor ?? 'Admin DesaMind',
    lessons: body.lessons ?? [],
    rating: Number(body.rating ?? 4.5),
    enrolled: Number(body.enrolled ?? 0),
    is_published: body.is_published ?? true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('training_modules', fallback, fallback);
  if (error) return jsonError(error.message);

  return NextResponse.json(normalizeTrainingModule(data as any), { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing module id', 400);

  const { data, error } = await updateRow('training_modules', id, updates, { id, ...updates });
  if (error) return jsonError(error.message);
  return NextResponse.json(normalizeTrainingModule(data as any));
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing module id', 400);

  const { error } = await deleteRow('training_modules', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
