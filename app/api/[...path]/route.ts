import { createStaticResponse, resolveStaticApi } from '@/lib/static-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requestInit(request: Request): Promise<RequestInit> {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return { method };

  const contentType = request.headers.get('content-type') ?? '';
  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    return { method, body: await request.formData() };
  }

  return { method, body: await request.text() };
}

async function handle(request: Request) {
  const result = await resolveStaticApi(request.url, await requestInit(request));
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return createStaticResponse(result);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
    },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
