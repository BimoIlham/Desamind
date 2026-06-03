import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

type QueryOptions = {
  filters?: Record<string, string | number | boolean | null | undefined>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  select?: string;
};

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

export async function listRows<T>(
  table: string,
  _fallback: T[] = [],
  options: QueryOptions = {}
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [] as T[];

  let query = supabase.from(table).select(options.select ?? '*');

  for (const [key, value] of Object.entries(options.filters ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  }

  if (options.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? true,
    });
  }

  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    console.error(`[API] Failed to list ${table}:`, error);
    return [] as T[];
  }

  return (data ?? []) as T[];
}

export async function getRowById<T>(
  table: string,
  id: string,
  _fallback: T | null = null,
  select = '*'
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[API] Failed to get ${table}/${id}:`, error);
    return null;
  }

  return (data as T | null) ?? null;
}

export async function countRows(
  table: string,
  filters: QueryOptions['filters'] = {}
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[API] Failed to count ${table}:`, error);
    return null;
  }

  return count ?? 0;
}

export async function insertRow<T>(
  table: string,
  payload: Record<string, unknown>,
  _fallback?: T
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { data: null, error: new Error('Database is not configured') };

  const { data, error } = await supabase
    .from(table)
    .insert(cleanPayload(payload))
    .select()
    .single();

  return { data: data as T | null, error };
}

export async function updateRow<T>(
  table: string,
  id: string,
  payload: Record<string, unknown>,
  _fallback?: T
) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { data: null, error: new Error('Database is not configured') };

  const { data, error } = await supabase
    .from(table)
    .update(cleanPayload({ ...payload, updated_at: new Date().toISOString() }))
    .eq('id', id)
    .select()
    .single();

  return { data: data as T | null, error };
}

export async function deleteRow(table: string, id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { error: new Error('Database is not configured') };

  const { error } = await supabase.from(table).delete().eq('id', id);
  return { error };
}
