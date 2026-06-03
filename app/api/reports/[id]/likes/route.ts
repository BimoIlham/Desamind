import { NextRequest, NextResponse } from 'next/server';
import { countRows } from '@/lib/api-helpers';
import { getSupabaseServerClient } from '@/lib/supabase-server';

async function getLikeCount(reportId: string, fallback: number) {
  return (await countRows('report_likes', { report_id: reportId })) ?? fallback;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const count = await getLikeCount(id, 0);
  return NextResponse.json({ count, liked: false });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const user_id = body.user_id ?? 'anonymous';
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase
      .from('report_likes')
      .upsert({ report_id: id, user_id }, { onConflict: 'report_id,user_id' });

    if (!error) {
      const count = await getLikeCount(id, 1);
      return NextResponse.json({ success: true, count, liked: true });
    }
  }

  return NextResponse.json({ success: true, count: 1, liked: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const user_id = body.user_id ?? 'anonymous';
  const supabase = getSupabaseServerClient();

  if (supabase) {
    await supabase
      .from('report_likes')
      .delete()
      .eq('report_id', id)
      .eq('user_id', user_id);
  }

  const count = await getLikeCount(id, 0);
  return NextResponse.json({ success: true, count, liked: false });
}
