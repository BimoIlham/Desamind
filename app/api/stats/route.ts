import { NextResponse } from 'next/server';
import { countRows } from '@/lib/api-helpers';

export async function GET() {
  try {
    const reportsCount = await countRows('reports');
    const productsCount = await countRows('products');
    const resolvedCount = await countRows('reports', { status: 'completed' });

    return NextResponse.json({
      reports: reportsCount ?? 0,
      products: productsCount ?? 0,
      resolved: resolvedCount ?? 0
    });
  } catch (error) {
    console.error('[API_STATS_GET]', error);
    return NextResponse.json({ reports: 0, products: 0, resolved: 0 }, { status: 500 });
  }
}
