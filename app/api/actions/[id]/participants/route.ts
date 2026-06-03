import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuthUser } from '@/lib/auth-server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  if (!supabase) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('action_participants')
    .select('id, user_id, name, email, created_at')
    .eq('action_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[API] Failed to list action participants:', error);
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Login diperlukan untuk mendaftar kegiatan.' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database belum dikonfigurasi.' }, { status: 503 });
  }

  const { data: action, error: actionError } = await supabase
    .from('community_actions')
    .select('id, status, max_participants, current_participants')
    .eq('id', id)
    .maybeSingle();

  if (actionError || !action) {
    return NextResponse.json({ error: 'Kegiatan tidak ditemukan.' }, { status: 404 });
  }

  if (action.status !== 'open') {
    return NextResponse.json({ error: 'Pendaftaran kegiatan sudah ditutup.' }, { status: 400 });
  }

  if (Number(action.current_participants || 0) >= Number(action.max_participants || 0)) {
    return NextResponse.json({ error: 'Kuota peserta sudah penuh.' }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from('action_participants')
    .insert({
      action_id: id,
      user_id: user.id,
      name: user.name,
      email: user.email,
    });

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Anda sudah terdaftar pada kegiatan ini.' }, { status: 409 });
    }

    console.error('[API] Failed to register action participant:', insertError);
    return NextResponse.json({ error: insertError.message || 'Gagal mendaftar kegiatan.' }, { status: 500 });
  }

  const { count } = await supabase
    .from('action_participants')
    .select('*', { count: 'exact', head: true })
    .eq('action_id', id);

  const nextCount = Math.max(Number(action.current_participants || 0) + 1, count ?? 0);
  await supabase
    .from('community_actions')
    .update({
      current_participants: nextCount,
      status: nextCount >= Number(action.max_participants || 0) ? 'full' : action.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  const participant = {
    id: `${id}-${user.id}`,
    user_id: user.id,
    name: user.name,
    email: user.email,
    created_at: new Date().toISOString(),
  };

  return NextResponse.json({ participant, current_participants: nextCount }, { status: 201 });
}
