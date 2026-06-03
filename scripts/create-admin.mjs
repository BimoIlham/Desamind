// Create (or promote) an admin account in Supabase Auth.
// Usage:
//   node scripts/create-admin.mjs <email> <password> "<Nama>"
// Example:
//   node scripts/create-admin.mjs admin@desamind.id rahasia123 "Admin Desa"
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const [, , emailArg, passwordArg, ...nameParts] = process.argv;
const email = (emailArg ?? 'admin@desamind.id').toLowerCase();
const password = passwordArg ?? 'admin12345';
const name = nameParts.join(' ') || 'Admin DesaMind';

const env = loadEnv('.env.local');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function initials(n) {
  return n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'AD';
}

// Find existing user by email
let existing = null;
for (let page = 1; page <= 20; page++) {
  const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
  existing = data?.users.find((u) => u.email?.toLowerCase() === email);
  if (existing || (data?.users.length ?? 0) < 200) break;
}

const meta = { name, role: 'admin', status: 'active', avatar: initials(name) };

if (existing) {
  const { error } = await sb.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: meta,
  });
  console.log(error ? `[ERR] ${error.message}` : `[OK] Promoted existing account to admin: ${email}`);
} else {
  const { error } = await sb.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: meta,
  });
  console.log(error ? `[ERR] ${error.message}` : `[OK] Admin created: ${email}`);
}

console.log('\nLogin di /auth/login dengan:');
console.log('  Email   :', email);
console.log('  Password:', password);
