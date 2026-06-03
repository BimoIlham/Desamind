import { NextResponse } from 'next/server';
import { listRows } from '@/lib/api-helpers';
import type { AIPrediction, Report } from '@/lib/types';

export async function POST() {
  const reports = await listRows<Report>('reports', [], {
    order: { column: 'created_at', ascending: false },
    limit: 200,
  });

  if (process.env.OPENAI_API_KEY) {
    try {
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/';
      const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
      const modelName = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 300,
          messages: [
            { role: 'system', content: 'Anda adalah sistem AI prediksi keamanan desa. Analisa data terakhir dan berikan prediksi.' },
            { role: 'user', content: `Berdasarkan data laporan desa berikut, apakah ada tren atau prediksi khusus yang perlu desa waspadai? Data: ${JSON.stringify(summarizeReports(reports))}. Berikan JSON saja dengan struktur { predictions: [ {id, title, category, description, recommendation, risk_level, confidence, icon} ] }` },
          ],
        }),
      });
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (raw) {
        const cleanJsonString = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonString);
        if (parsed.predictions) return NextResponse.json(parsed);
      }
    } catch {
      // Use database-derived predictions below.
    }
  }

  return NextResponse.json({ predictions: buildPredictions(reports) });
}

function summarizeReports(reports: Report[]) {
  return Object.values(
    reports.reduce((acc: Record<string, { category: string; total: number; pending: number; in_progress: number }>, report) => {
      const item = acc[report.category] ?? { category: report.category, total: 0, pending: 0, in_progress: 0 };
      item.total += 1;
      if (report.status === 'pending') item.pending += 1;
      if (report.status === 'in_progress') item.in_progress += 1;
      acc[report.category] = item;
      return acc;
    }, {})
  );
}

function buildPredictions(reports: Report[]): AIPrediction[] {
  return summarizeReports(reports)
    .filter((item) => item.pending + item.in_progress > 0)
    .sort((a, b) => (b.pending + b.in_progress + b.total) - (a.pending + a.in_progress + a.total))
    .slice(0, 5)
    .map((item, index) => {
      const open = item.pending + item.in_progress;
      const confidence = Math.min(95, 50 + open * 10 + item.total * 3);
      const risk_level = confidence >= 80 ? 'Tinggi' : confidence >= 65 ? 'Sedang' : 'Rendah';
      return {
        id: `prediction-${item.category}-${index}`,
        category: item.category,
        risk_level,
        confidence,
        title: `Potensi eskalasi isu ${item.category}`,
        description: `${open} dari ${item.total} laporan kategori ${item.category} masih membutuhkan tindak lanjut.`,
        recommendation: `Prioritaskan verifikasi lapangan dan rencana penyelesaian untuk laporan ${item.category} yang belum selesai.`,
        icon: '!',
      };
    });
}
