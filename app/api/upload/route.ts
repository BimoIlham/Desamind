/**
 * app/api/upload/route.ts
 * Unified image upload endpoint backed by Supabase Storage.
 *
 * POST: multipart/form-data with field `file` (and optional `folder`).
 * Returns { url } pointing to the public object URL.
 *
 * This is the single, free upload mechanism used across the whole app
 * (reports, products, gallery, articles, training modules, projects, stores).
 * It requires no third-party service — only the Supabase project that is
 * already configured in .env.local.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const BUCKET = 'uploads';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function sanitizeFolder(folder: string | null) {
  if (!folder) return 'misc';
  // keep simple, safe segment names only
  return folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'misc';
}

function extFromType(type: string) {
  switch (type) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Penyimpanan belum dikonfigurasi. Periksa kredensial Supabase di .env.local.' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Format permintaan tidak valid (butuh multipart/form-data).' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File gambar wajib diunggah (field "file").' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran gambar maksimal 5MB.' }, { status: 400 });
  }

  const type = file.type || 'image/jpeg';
  if (!ALLOWED.includes(type)) {
    return NextResponse.json({ error: 'Format tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.' }, { status: 400 });
  }

  const folder = sanitizeFolder(formData.get('folder') as string | null);
  const ext = extFromType(type);
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Ensure bucket exists (id-empotent — ignore "already exists" errors).
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => undefined);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: type, cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('[API] upload error:', uploadError);
    return NextResponse.json({ error: `Gagal mengunggah gambar: ${uploadError.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
