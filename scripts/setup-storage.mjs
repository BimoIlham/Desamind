// Create/ensure public storage buckets used by the app.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  const env = {};
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch (e) {
    console.error('Cannot read', path, e.message);
  }
  return env;
}

const env = loadEnv('.env.local');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const buckets = ['uploads', 'report-images'];
for (const id of buckets) {
  const { error } = await sb.storage.createBucket(id, { public: true, fileSizeLimit: 5242880 });
  if (error && !/already exists/i.test(error.message)) {
    console.log(`  [ERR] ${id}: ${error.message}`);
  } else {
    // make sure it's public even if it pre-existed
    await sb.storage.updateBucket(id, { public: true }).catch(() => {});
    console.log(`  [OK] bucket ready: ${id}`);
  }
}

const { data } = await sb.storage.listBuckets();
console.log('Buckets now:', data.map((b) => `${b.id}(public=${b.public})`).join(', '));
