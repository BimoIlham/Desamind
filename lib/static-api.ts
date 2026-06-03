import {
  STATIC_ACTION_PARTICIPANTS,
  STATIC_ACTIONS,
  STATIC_ANNOUNCEMENTS,
  STATIC_APP_SETTINGS,
  STATIC_ARTICLES,
  STATIC_APB_DESA,
  STATIC_DASHBOARD_STATS,
  STATIC_GALLERY,
  STATIC_HEALTH_SCORE,
  STATIC_JOBS,
  STATIC_ORDERS,
  STATIC_PREDICTIONS,
  STATIC_PRODUCTS,
  STATIC_PROJECTS,
  STATIC_REPORT_COMMENTS,
  STATIC_REPORT_HISTORY,
  STATIC_REPORTS,
  STATIC_REVIEWS,
  STATIC_STORES,
  STATIC_TRAINING_MODULES,
  STATIC_UMKM_STATS,
  STATIC_USERS,
} from '@/lib/static-data';
import { createRadiusBoundary } from '@/lib/map-settings';

type StaticResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

const jsonHeaders = { 'Content-Type': 'application/json' };

function ok(data: unknown, status = 200): StaticResult {
  return { ok: status >= 200 && status < 300, status, data };
}

function notFound(message = 'Data tidak ditemukan.'): StaticResult {
  return { ok: false, status: 404, data: { error: message } };
}

function withStores() {
  return STATIC_PRODUCTS.map((product) => ({
    ...product,
    stores: STATIC_STORES.find((store) => store.id === product.store_id) ?? null,
  }));
}

function byId<T extends { id: string }>(rows: T[], id: string) {
  return rows.find((row) => row.id === id) ?? null;
}

function searchParamsFor(input: string) {
  return new URL(input, 'https://static.local');
}

async function readBody(init?: RequestInit): Promise<Record<string, unknown>> {
  const body = init?.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return Object.fromEntries(body.entries()) as Record<string, unknown>;
  }
  return {};
}

function classifyCategory(payload: Record<string, unknown>) {
  const text = `${payload.title ?? ''} ${payload.description ?? ''}`.toLowerCase();
  if (/(jalan|jembatan|lampu|irigasi|drainase|rusak|berlubang)/.test(text)) return 'Infrastruktur';
  if (/(sampah|bau|limbah|kotor)/.test(text)) return 'Sampah';
  if (/(sakit|posyandu|obat|puskesmas|kesehatan)/.test(text)) return 'Kesehatan';
  if (/(maling|rawan|keamanan|lampu|ronda)/.test(text)) return 'Keamanan';
  if (/(pohon|banjir|sungai|lingkungan|irigasi)/.test(text)) return 'Lingkungan';
  return 'Lainnya';
}

function productList(url: URL) {
  let products = withStores();
  const storeId = url.searchParams.get('store_id');
  const owner = url.searchParams.get('owner');

  if (storeId) products = products.filter((product) => product.store_id === storeId);
  if (owner === 'me') products = products.filter((product) => product.user_id === 'demo-admin');

  return products;
}

function orderList(url: URL) {
  const owner = url.searchParams.get('owner');
  const orders = STATIC_ORDERS.map((order) => ({
    ...order,
    stores: STATIC_STORES.find((store) => store.id === order.store_id) ?? null,
  }));

  if (owner === 'me') return orders.filter((order) => order.store_id === 'store-1');
  return orders;
}

function aiSolutions(category: string) {
  const fallback: Record<string, { step: string; detail: string }[]> = {
    Infrastruktur: [
      { step: 'Koordinasi Tim Teknis', detail: 'Jadwalkan survei lapangan dan dokumentasikan tingkat kerusakan.' },
      { step: 'Pengamanan Sementara', detail: 'Pasang tanda peringatan agar warga dapat menghindari titik berbahaya.' },
      { step: 'Tindak Lanjut Anggaran', detail: 'Masukkan perbaikan ke daftar prioritas pekerjaan desa.' },
    ],
    Sampah: [
      { step: 'Pengangkutan Tambahan', detail: 'Tambah jadwal angkut di titik yang dilaporkan.' },
      { step: 'Kerja Bakti Lokal', detail: 'Libatkan RT/RW dan kader lingkungan untuk pembersihan awal.' },
      { step: 'Edukasi Pemilahan', detail: 'Sosialisasikan pemilahan sampah agar penumpukan tidak berulang.' },
    ],
  };

  return fallback[category] ?? [
    { step: 'Verifikasi Lapangan', detail: 'Petugas desa meninjau lokasi dan mencatat dampak utama.' },
    { step: 'Tetapkan PIC', detail: 'Tentukan penanggung jawab tindak lanjut laporan.' },
    { step: 'Update Warga', detail: 'Berikan pembaruan status setelah keputusan awal dibuat.' },
  ];
}

export function isStaticApiUrl(input: RequestInfo | URL) {
  const raw = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  try {
    const url = searchParamsFor(raw);
    return url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export async function resolveStaticApi(input: RequestInfo | URL, init?: RequestInit): Promise<StaticResult> {
  const raw = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  const url = searchParamsFor(raw);
  const path = url.pathname.replace(/\/$/, '');
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = await readBody(init);

  if (path === '/api/settings') {
    return ok(method === 'GET' ? STATIC_APP_SETTINGS : { ...STATIC_APP_SETTINGS, ...body });
  }

  if (path === '/api/geocode') {
    const lat = Number(url.searchParams.get('lat') ?? STATIC_APP_SETTINGS.center_lat);
    const lng = Number(url.searchParams.get('lng') ?? STATIC_APP_SETTINGS.center_lng);
    const centerLat = Number.isFinite(lat) ? lat : STATIC_APP_SETTINGS.center_lat;
    const centerLng = Number.isFinite(lng) ? lng : STATIC_APP_SETTINGS.center_lng;
    return ok({
      ...STATIC_APP_SETTINGS,
      lat: centerLat,
      lng: centerLng,
      display_name: `${STATIC_APP_SETTINGS.village_name}, ${STATIC_APP_SETTINGS.city_name}`,
      boundary_geojson: STATIC_APP_SETTINGS.boundary_geojson ?? createRadiusBoundary([centerLat, centerLng], STATIC_APP_SETTINGS.fallback_radius_m),
      boundary_precision: 'estimated_radius',
      center_precision: 'area',
      source_label: 'data statis',
    });
  }

  if (path === '/api/dashboard/stats') return ok(STATIC_DASHBOARD_STATS);
  if (path === '/api/umkm/stats') return ok(STATIC_UMKM_STATS);
  if (path === '/api/apbdesa') return ok(STATIC_APB_DESA);
  if (path === '/api/announcements') return ok(STATIC_ANNOUNCEMENTS);
  if (path === '/api/gallery') return ok(STATIC_GALLERY);
  if (path === '/api/admin/users') {
    if (method === 'PATCH') {
      const id = String(body.id ?? '');
      const user = byId(STATIC_USERS, id);
      return user ? ok({ ...user, ...body }) : notFound();
    }
    if (method === 'DELETE') return ok({ ok: true });
    return ok(STATIC_USERS);
  }

  if (path === '/api/reports') {
    if (method === 'POST') {
      return ok({
        id: `report-demo-${Date.now()}`,
        user_id: 'demo-warga',
        author_name: 'Warga',
        status: 'pending',
        upvotes: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        ...body,
      }, 201);
    }

    let reports = [...STATIC_REPORTS];
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const limit = Number(url.searchParams.get('limit'));
    if (status) reports = reports.filter((report) => report.status === status);
    if (category) reports = reports.filter((report) => report.category === category);
    reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return ok(Number.isFinite(limit) && limit > 0 ? reports.slice(0, limit) : reports);
  }

  const reportMatch = path.match(/^\/api\/reports\/([^/]+)(?:\/([^/]+))?$/);
  if (reportMatch) {
    const [, id, section] = reportMatch;
    const report = byId(STATIC_REPORTS, id);
    if (!report) return notFound();
    if (!section) return ok(report);
    if (section === 'likes') {
      if (method === 'POST') return ok({ count: report.upvotes + 1, liked: true });
      if (method === 'DELETE') return ok({ count: Math.max(0, report.upvotes - 1), liked: false });
      return ok({ count: report.upvotes, liked: false });
    }
    if (section === 'comments') {
      if (method === 'POST') {
        return ok({
          id: `comment-demo-${Date.now()}`,
          report_id: id,
          author_name: body.author_name ?? 'Warga',
          content: body.content ?? '',
          created_at: new Date().toISOString(),
        }, 201);
      }
      return ok(STATIC_REPORT_COMMENTS.filter((comment) => comment.report_id === id));
    }
    if (section === 'history') return ok(STATIC_REPORT_HISTORY.filter((item) => item.report_id === id));
  }

  if (path === '/api/products') {
    if (method === 'POST') {
      const product = {
        id: `product-demo-${Date.now()}`,
        store_id: 'store-1',
        seller_name: body.seller_name ?? 'Warung Bu Sari',
        image_url: body.image_url || STATIC_PRODUCTS[0].image_url,
        stock: 20,
        featured: false,
        sales_count: 0,
        rating: 0,
        reviews_count: 0,
        created_at: new Date().toISOString(),
        ...body,
      };
      return ok(product, 201);
    }
    if (method === 'DELETE') return ok({ ok: true });
    return ok(productList(url));
  }

  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch) {
    const product = productList(url).find((item) => item.id === productMatch[1]);
    return product ? ok(product) : notFound();
  }

  if (path === '/api/stores') {
    if (method === 'POST') {
      return ok({
        id: `store-demo-${Date.now()}`,
        user_id: 'demo-admin',
        status: 'pending',
        created_at: new Date().toISOString(),
        ...body,
      }, 201);
    }
    if (url.searchParams.get('owner') === 'me') return ok([STATIC_STORES[0]]);
    return ok(STATIC_STORES);
  }

  const storeMatch = path.match(/^\/api\/stores\/([^/]+)$/);
  if (storeMatch) {
    if (method === 'PATCH') {
      const store = byId(STATIC_STORES, storeMatch[1]);
      return store ? ok({ ...store, ...body }) : notFound();
    }
    const store = byId(STATIC_STORES, storeMatch[1]);
    return store ? ok(store) : notFound();
  }

  if (path === '/api/orders') {
    if (method === 'PATCH') return ok({ ok: true, ...body });
    return ok(orderList(url));
  }

  const orderPaidMatch = path.match(/^\/api\/orders\/([^/]+)\/mark-paid$/);
  if (orderPaidMatch) {
    const order = byId(STATIC_ORDERS, orderPaidMatch[1]) ?? STATIC_ORDERS[0];
    return ok({ ...order, status: 'terbayar' });
  }

  if (path === '/api/reviews') {
    if (method === 'POST') {
      return ok({
        id: `review-demo-${Date.now()}`,
        buyer_id: 'demo-warga',
        created_at: new Date().toISOString(),
        ...body,
      }, 201);
    }
    const productId = url.searchParams.get('product_id');
    return ok(productId ? STATIC_REVIEWS.filter((review) => review.product_id === productId) : STATIC_REVIEWS);
  }

  if (path === '/api/jobs') return ok(STATIC_JOBS);
  const jobMatch = path.match(/^\/api\/jobs\/([^/]+)$/);
  if (jobMatch) return ok(byId(STATIC_JOBS, jobMatch[1]));

  if (path === '/api/articles') return ok(STATIC_ARTICLES);
  const articleMatch = path.match(/^\/api\/articles\/([^/]+)$/);
  if (articleMatch) return ok(byId(STATIC_ARTICLES, articleMatch[1]));

  if (path === '/api/training-modules') return ok(STATIC_TRAINING_MODULES);
  const moduleMatch = path.match(/^\/api\/training-modules\/([^/]+)$/);
  if (moduleMatch) return ok(byId(STATIC_TRAINING_MODULES, moduleMatch[1]));

  if (path === '/api/actions') return ok(STATIC_ACTIONS);
  const actionMatch = path.match(/^\/api\/actions\/([^/]+)(?:\/participants)?$/);
  if (actionMatch) {
    const action = byId(STATIC_ACTIONS, actionMatch[1]);
    if (!action) return notFound();
    if (path.endsWith('/participants')) {
      if (method === 'POST') {
        const participant = {
          id: `participant-demo-${Date.now()}`,
          action_id: action.id,
          user_id: 'demo-warga',
          name: 'Warga',
          email: 'warga@desamind.id',
          created_at: new Date().toISOString(),
        };
        return ok({ participant, current_participants: action.current_participants + 1 }, 201);
      }
      return ok(STATIC_ACTION_PARTICIPANTS.filter((participant) => participant.action_id === action.id));
    }
    return ok(action);
  }

  if (path === '/api/projects') return ok(STATIC_PROJECTS);
  const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) return ok(byId(STATIC_PROJECTS, projectMatch[1]));

  if (path === '/api/upload') {
    return ok({ url: imgFallback(), path: 'static/demo-upload.jpg' }, 201);
  }

  if (path === '/api/shipping') {
    return ok([{ service: 'REG', description: 'Regular', cost: [{ value: 15000, etd: '2-3' }] }]);
  }

  if (path === '/api/checkout') {
    return ok({
      order_id: `DM-STATIC-${Date.now()}`,
      token: 'STATIC_CHECKOUT',
      redirect_url: null,
    }, 201);
  }

  if (path === '/api/sos') return ok({ ok: true, id: `sos-demo-${Date.now()}` }, method === 'POST' ? 201 : 200);

  if (path === '/api/auth/me') return ok({ user: null });
  if (path === '/api/auth/login') return ok({ user: STATIC_USERS[0] });
  if (path === '/api/auth/register') return ok({ user: STATIC_USERS[1], pending: false }, 201);
  if (path === '/api/auth/logout') return ok({ ok: true });
  if (path === '/api/auth/change-password') return ok({ ok: true });

  if (path === '/api/ai/classify') return ok({ category: classifyCategory(body) });
  if (path === '/api/ai/recommend') return ok({ solutions: aiSolutions(String(body.category ?? '')) });
  if (path === '/api/ai/chat') {
    return ok({
      reply: 'Ini adalah jawaban demo statis DesaMind. Untuk kebutuhan warga, silakan cek menu laporan, UMKM, pengumuman, peta, atau transparansi desa.',
    });
  }
  if (path === '/api/ai/predict') return ok({ predictions: STATIC_PREDICTIONS });
  if (path === '/api/ai/health-score') {
    if (method === 'POST') return ok({ narrative: STATIC_HEALTH_SCORE.ai_narrative });
    return ok(STATIC_HEALTH_SCORE);
  }
  if (path === '/api/ai/generate-product') {
    return ok({
      name: 'Produk UMKM Demo',
      description: 'Deskripsi produk otomatis mode statis.',
      category: 'Makanan',
      price: 20000,
    });
  }

  return notFound('Endpoint statis tidak tersedia.');
}

function imgFallback() {
  return 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=900&auto=format&fit=crop';
}

export function createStaticResponse(result: StaticResult): Response {
  return new Response(JSON.stringify(result.data), {
    status: result.status,
    headers: jsonHeaders,
  });
}

export async function staticApiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return createStaticResponse(await resolveStaticApi(input, init));
}

declare global {
  interface Window {
    __DESAMIND_STATIC_API_INSTALLED__?: boolean;
  }
}

export function installStaticApi() {
  if (typeof window === 'undefined' || window.__DESAMIND_STATIC_API_INSTALLED__) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (isStaticApiUrl(input)) return staticApiFetch(input, init);
    return originalFetch(input, init);
  };

  window.__DESAMIND_STATIC_API_INSTALLED__ = true;
}
