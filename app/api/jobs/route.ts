/**
 * app/api/jobs/route.ts
 * GET: List local job postings. POST: Create a job posting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { deleteRow, insertRow, jsonError, listRows, updateRow } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const is_active = searchParams.get('is_active');

  const jobs = await listRows('jobs', [], {
    filters: { category, is_active: is_active === null ? undefined : is_active === 'true' },
    order: { column: 'created_at', ascending: false },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, company, location, type, phone_number, deadline, category } = body;
  if (!title || !phone_number) return jsonError('Missing required fields', 400);

  const fallback = {
    id: `job-${Date.now()}`,
    title,
    company,
    description,
    category: category ?? 'Umum',
    type: type ?? 'full_time',
    location: location ?? null,
    deadline: deadline ?? null,
    salary_range: body.salary_range ?? null,
    requirements: body.requirements ?? [],
    phone_number,
    is_active: body.is_active ?? true,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await insertRow('jobs', fallback, fallback);
  if (error) return jsonError(error.message);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError('Missing job id', 400);

  const { data, error } = await updateRow('jobs', id, updates, { id, ...updates });
  if (error) return jsonError(error.message);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('Missing job id', 400);

  const { error } = await deleteRow('jobs', id);
  if (error) return jsonError(error.message);
  return NextResponse.json({ deleted: true });
}
