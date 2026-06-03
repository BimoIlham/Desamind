import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { jsonError } from '@/lib/api-helpers';
import type { APBDesProgram, APBDesa } from '@/lib/types';

type Allocation = APBDesa['allocations'][number];

function parseMaybeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function normalizeApbDesa(data: Record<string, unknown>): APBDesa {
  return {
    year: Number(data.year) || new Date().getFullYear(),
    total_budget: Number(data.total_budget) || 0,
    realized: Number(data.realized) || 0,
    allocations: parseMaybeArray<Partial<Allocation>>(data.allocations)
      .filter((item) => String(item.category ?? '').trim())
      .map((item) => ({
        category: String(item.category ?? '').trim(),
        amount: Number(item.amount) || 0,
        color: String(item.color || '#155E55'),
      })),
    programs: parseMaybeArray<Partial<APBDesProgram>>(data.programs)
      .filter((item) => String(item.name ?? '').trim())
      .map((item) => ({
        name: String(item.name ?? '').trim(),
        category: String(item.category ?? '').trim(),
        budget: Number(item.budget) || 0,
        status: String(item.status || 'Direncanakan'),
      })),
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return jsonError('Database is not configured', 503);

  const { data, error } = await supabase
    .from('apbdesa')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[API] Failed to get apbdesa:', error);
    return jsonError(error.message);
  }

  if (!data) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(normalizeApbDesa(data));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = getSupabaseServerClient();

  if (!supabase) return jsonError('Database is not configured', 503);

  const payload = normalizeApbDesa(body);
  const { data, error } = await supabase
    .from('apbdesa')
    .upsert(payload, { onConflict: 'year' })
    .select()
    .single();

  if (error) return jsonError(error.message);
  return NextResponse.json(normalizeApbDesa(data));
}
