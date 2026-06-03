export type StoreProfile = {
  id: string;
  user_id?: string;
  name: string;
  description?: string | null;
  address?: string | null;
  logo_url?: string | null;
  status?: string;
  created_at?: string;
};

export function normalizeStoreProfile<T extends StoreProfile | null>(store: T): T {
  if (!store) return store;

  const rawDescription = store.description ?? '';
  const addressMatch = rawDescription.match(/\n*\s*Alamat:\s*([\s\S]*)$/i);
  const cleanedDescription = rawDescription.replace(/\n*\s*Alamat:\s*[\s\S]*$/i, '').trim();

  return {
    ...store,
    description: cleanedDescription,
    address: store.address || addressMatch?.[1]?.trim() || '',
  };
}

export function normalizeStoreProfiles<T extends StoreProfile>(stores: T[]) {
  return stores.map((store) => normalizeStoreProfile(store));
}
