/**
 * app/api/ai/classify/route.ts
 * POST: Classify a report's category using OpenAI or Gemini.
 * Falls back to a simple keyword-matching algorithm if no API key.
 */
import { NextRequest, NextResponse } from 'next/server';

const CATEGORIES = ['Infrastruktur', 'Sampah', 'Kesehatan', 'Keamanan', 'Lingkungan', 'Pendidikan', 'Lainnya'];

/** Keyword-based fallback classification */
function keywordClassify(text: string): string {
  const lower = text.toLowerCase();
  if (/jalan|jembatan|gorong|drainase|saluran|irigasi|bangunan|gedung/.test(lower)) return 'Infrastruktur';
  if (/sampah|limbah|buang|bau|kotor|tpa/.test(lower)) return 'Sampah';
  if (/sehat|sakit|puskesmas|posyandu|obat|covid|demam|dbd|wabah/.test(lower)) return 'Kesehatan';
  if (/pencuri|maling|gelap|lampu|keamanan|kriminal|ronda/.test(lower)) return 'Keamanan';
  if (/pohon|banjir|longsor|lingkungan|hijau|tanah|sungai/.test(lower)) return 'Lingkungan';
  if (/sekolah|pendidikan|belajar|siswa|guru|perpustakaan/.test(lower)) return 'Pendidikan';
  return 'Lainnya';
}

export async function POST(request: NextRequest) {
  const { title, description } = await request.json();
  const text = `${title} ${description}`.trim();

  if (!text) {
    return NextResponse.json({ category: 'Lainnya' });
  }

  // Try OpenAI API API if key is configured (supports Gemini OpenAI compatibility)
  if (process.env.OPENAI_API_KEY) {
    try {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/';
      const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
      const modelName = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 20,
          messages: [
            {
              role: 'system',
              content: `Anda adalah sistem klasifikasi laporan desa. Klasifikasikan laporan ke salah satu kategori berikut: ${CATEGORIES.join(', ')}. Balas HANYA dengan nama kategori, tanpa penjelasan tambahan.`,
            },
            { role: 'user', content: text },
          ],
        }),
      });

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim() ?? '';

      // Validate the returned category
      const matched = CATEGORIES.find((c) => raw.toLowerCase().includes(c.toLowerCase()));
      if (matched) return NextResponse.json({ category: matched });
    } catch {
      // Fallthrough to keyword classification
    }
  }

  // Keyword-based fallback
  const category = keywordClassify(text);
  return NextResponse.json({ category });
}
