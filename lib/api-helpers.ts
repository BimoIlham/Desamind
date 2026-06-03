import { STATIC_TABLES } from '@/lib/static-data';

type QueryOptions = {
  filters?: Record<string, string | number | boolean | null | undefined>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  select?: string;
};

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

export function cleanPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function tableRows(table: string) {
  return [...(STATIC_TABLES[table] ?? [])] as Record<string, unknown>[];
}

function matchesFilters(row: Record<string, unknown>, filters: QueryOptions['filters'] = {}) {
  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined || value === null || value === '') return true;
    return row[key] === value;
  });
}

export async function listRows<T>(
  table: string,
  fallback: T[] = [],
  options: QueryOptions = {}
) {
  void fallback;
  let rows = tableRows(table).filter((row) => matchesFilters(row, options.filters));

  if (options.order) {
    const { column, ascending = true } = options.order;
    rows = rows.sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      const at = typeof av === 'string' && !Number.isNaN(Date.parse(av)) ? Date.parse(av) : av;
      const bt = typeof bv === 'string' && !Number.isNaN(Date.parse(bv)) ? Date.parse(bv) : bv;
      if (at === bt) return 0;
      return (at ?? '') > (bt ?? '') ? (ascending ? 1 : -1) : (ascending ? -1 : 1);
    });
  }

  if (options.limit) rows = rows.slice(0, options.limit);
  return rows as T[];
}

export async function getRowById<T>(
  table: string,
  id: string,
  fallback: T | null = null,
  select = '*'
) {
  void fallback;
  void select;
  return (tableRows(table).find((row) => row.id === id) as T | undefined) ?? null;
}

export async function countRows(
  table: string,
  filters: QueryOptions['filters'] = {}
) {
  return tableRows(table).filter((row) => matchesFilters(row, filters)).length;
}

export async function insertRow<T>(
  table: string,
  payload: Record<string, unknown>,
  fallback?: T
) {
  void table;
  void fallback;
  return {
    data: cleanPayload({ id: `static-${Date.now()}`, created_at: new Date().toISOString(), ...payload }) as T,
    error: null,
  };
}

export async function updateRow<T>(
  table: string,
  id: string,
  payload: Record<string, unknown>,
  fallback?: T
) {
  void table;
  void fallback;
  return {
    data: cleanPayload({ id, ...payload, updated_at: new Date().toISOString() }) as T,
    error: null,
  };
}

export async function deleteRow(table: string, id: string) {
  void table;
  void id;
  return { error: null };
}
