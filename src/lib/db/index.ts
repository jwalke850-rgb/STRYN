import "server-only";
import { createLocalStore } from "./local";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

let store: Store | undefined;

export function db(): Store {
  if (!store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    store = url && key ? createSupabaseStore(url, key) : createLocalStore();
  }
  return store;
}

export type { Store } from "./types";
