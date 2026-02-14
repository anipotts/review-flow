import { createClient } from "@supabase/supabase-js";

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  value: string;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function isFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

export async function getSetting(key: string): Promise<string | undefined> {
  // Check in-memory cache
  const cached = cache.get(key);
  if (cached && isFresh(cached)) {
    return cached.value;
  }

  // Check Supabase app_settings
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (data?.value) {
      cache.set(key, { value: data.value, fetchedAt: Date.now() });
      return data.value;
    }
  } catch {
    // Fall through to env var
  }

  // Fall back to process.env
  const envValue = process.env[key];
  if (envValue) {
    cache.set(key, { value: envValue, fetchedAt: Date.now() });
  }
  return envValue;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | undefined>> {
  const result: Record<string, string | undefined> = {};

  // Check which keys need fetching
  const keysToFetch: string[] = [];
  for (const key of keys) {
    const cached = cache.get(key);
    if (cached && isFresh(cached)) {
      result[key] = cached.value;
    } else {
      keysToFetch.push(key);
    }
  }

  if (keysToFetch.length > 0) {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", keysToFetch);

      const dbValues = new Map(
        (data || []).map((row) => [row.key, row.value])
      );

      for (const key of keysToFetch) {
        const value = dbValues.get(key) ?? process.env[key];
        if (value) {
          cache.set(key, { value, fetchedAt: Date.now() });
        }
        result[key] = value;
      }
    } catch {
      // Fall back to env vars for all
      for (const key of keysToFetch) {
        result[key] = process.env[key];
      }
    }
  }

  return result;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("app_settings").select("key, value");

    const settings: Record<string, string> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
      cache.set(row.key, { value: row.value, fetchedAt: Date.now() });
    }
    return settings;
  } catch {
    return {};
  }
}

export function clearSettingsCache() {
  cache.clear();
}
