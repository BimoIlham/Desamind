/**
 * app/api/imagekit/auth/route.ts
 * Provides authentication parameters for client-side ImageKit uploads.
 */
import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function GET() {
  try {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        { error: 'ImageKit belum dikonfigurasi. Isi IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, dan NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT.' },
        { status: 503 }
      );
    }

    const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error: unknown) {
    console.error('ImageKit Auth Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal membuat autentikasi ImageKit.' }, { status: 500 });
  }
}
