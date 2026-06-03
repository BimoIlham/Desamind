import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, getRowById, jsonError, updateRow } from '@/lib/api-helpers';
import { normalizeTrainingModule } from '@/lib/training-modules';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainingModule = await getRowById('training_modules', id);

  if (!trainingModule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(normalizeTrainingModule(trainingModule as any));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await request.json();
  const { data, error } = await updateRow('training_modules', id, updates, { id, ...updates });

  if (error) return jsonError(error.message);
  return NextResponse.json(normalizeTrainingModule(data as any));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await deleteRow('training_modules', id);

  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
