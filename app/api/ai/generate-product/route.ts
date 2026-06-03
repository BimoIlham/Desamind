import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ProductAIResponse = {
  name: string;
  description: string;
  category: 'Makanan' | 'Kerajinan' | 'Pertanian' | 'Fashion' | 'Jasa';
};

const CATEGORIES = ['Makanan', 'Kerajinan', 'Pertanian', 'Fashion', 'Jasa'] as const;

function chatCompletionsUrl() {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
}

function isGeminiOpenAIBaseUrl() {
  return (process.env.OPENAI_BASE_URL ?? '').includes('generativelanguage.googleapis.com');
}

function cleanJson(text: string) {
  const withoutFence = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = withoutFence.match(/\{[\s\S]*\}/);
  return match ? match[0] : withoutFence;
}

function normalizeCategory(category: unknown): ProductAIResponse['category'] {
  const value = String(category ?? '').trim();
  return (CATEGORIES as readonly string[]).includes(value)
    ? (value as ProductAIResponse['category'])
    : 'Kerajinan';
}

function normalizeProductData(data: any): ProductAIResponse {
  const name = String(data?.name ?? '').trim();
  const description = String(data?.description ?? '').trim();

  if (!name || !description) {
    throw new Error('AI response JSON tidak lengkap.');
  }

  return {
    name: name.slice(0, 80),
    description,
    category: normalizeCategory(data?.category),
  };
}

function friendlyAIError(error: any) {
  const message = String(error?.message ?? error ?? '');

  if (
    message.includes('429') ||
    message.toLowerCase().includes('too many requests') ||
    message.toLowerCase().includes('quota exceeded')
  ) {
    const retryDelay = message.match(/retryDelay":"?(\d+)s"?/)?.[1];
    return {
      message: retryDelay
        ? `Kuota AI Gemini sedang habis. Coba upload ulang sekitar ${retryDelay} detik lagi, atau aktifkan billing/naikkan kuota di Google AI Studio.`
        : 'Kuota AI Gemini sedang habis. Coba lagi nanti, atau aktifkan billing/naikkan kuota di Google AI Studio.',
      status: 429,
    };
  }

  return {
    message: message || 'AI gagal menganalisis gambar.',
    status: 500,
  };
}

async function generateWithGeminiNative(params: {
  apiKey: string;
  model: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
}) {
  const genAI = new GoogleGenerativeAI(params.apiKey);
  const model = genAI.getGenerativeModel({
    model: params.model,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    params.prompt,
    {
      inlineData: {
        data: params.imageBase64,
        mimeType: params.mimeType,
      },
    },
  ]);

  const responseText = result.response.text();
  if (!responseText) throw new Error('AI response is empty');
  return responseText;
}

async function generateWithOpenAICompatible(params: {
  apiKey: string;
  model: string;
  prompt: string;
  imageDataUrl: string;
}) {
  const aiResponse = await fetch(chatCompletionsUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: params.prompt },
            {
              type: 'image_url',
              image_url: {
                url: params.imageDataUrl,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error(`AI API error ${aiResponse.status}: ${errorText}`);
  }

  const aiData = await aiResponse.json();
  const responseText = aiData?.choices?.[0]?.message?.content;
  if (!responseText) throw new Error('AI response is empty');
  return responseText;
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY belum dikonfigurasi.' }, { status: 500 });
    }

    // 1. Fetch the image from the provided URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from URL');
    }
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // 2. Prepare the prompt
    const prompt = `
      Anda adalah seorang asisten ahli untuk platform marketplace produk UMKM desa di Indonesia.
      Tugas Anda adalah melihat gambar produk yang diunggah, mengidentifikasi objek utama, lalu menghasilkan data produk yang relevan untuk dijual.
      Berikan respons HANYA dalam JSON valid dengan struktur berikut, tanpa markdown atau teks pengantar:
      {
        "name": "Nama objek produk yang terlihat jelas, singkat, maksimal 5 kata. Contoh jika gambar semangka: Semangka Segar",
        "description": "Deskripsi produk 1 paragraf yang menarik, menjelaskan ciri visual, fungsi, bahan/keunggulan yang tampak, dan cocok untuk marketplace.",
        "category": "Pilih satu dari: Makanan, Kerajinan, Pertanian, Fashion, Jasa"
      }
      Gunakan bahasa Indonesia yang natural dan profesional.
      Jangan menyebut hal yang tidak terlihat jelas dari gambar sebagai fakta.
      Jika objek utama adalah buah, sayur, hasil panen, atau bahan pangan segar, gunakan kategori Pertanian.
      Jika objek utama adalah makanan siap makan atau olahan, gunakan kategori Makanan.
      Jangan pernah memakai nama generik seperti "Produk UMKM Desa" jika objek utama bisa dikenali.
    `;

    const imageBase64 = buffer.toString('base64');
    const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

    // 3. Call Gemini native for Google-hosted keys, otherwise OpenAI-compatible API.
    const responseText = isGeminiOpenAIBaseUrl()
      ? await generateWithGeminiNative({ apiKey, model, prompt, imageBase64, mimeType })
      : await generateWithOpenAICompatible({ apiKey, model, prompt, imageDataUrl });
    
    // 4. Parse JSON from response
    const productData = normalizeProductData(JSON.parse(cleanJson(responseText)));

    return NextResponse.json(productData);

  } catch (error: any) {
    console.error('AI Product Generation Error:', error.message);
    const friendlyError = friendlyAIError(error);
    return NextResponse.json(
      { error: friendlyError.message },
      { status: friendlyError.status }
    );
  }
}
