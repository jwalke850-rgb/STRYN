import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { TableName } from "@/lib/types";
import type { ListOptions, NewRow, Row, Store } from "./types";

/**
 * Supabase-backed store. Uses the service-role key, so it must only ever run
 * on the server; access control for the console is handled by src/proxy.ts.
 */
export function createSupabaseStore(url: string, serviceKey: string): Store {
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  function fail(op: string, table: string, error: { message: string }): never {
    throw new Error(`Supabase ${op} on ${table} failed: ${error.message}`);
  }

  return {
    kind: "supabase",

    async list<T extends TableName>(table: T, opts: ListOptions<T> = {}) {
      let q = db.from(table).select("*");
      for (const [k, v] of Object.entries(opts.where ?? {})) {
        q = v === null ? q.is(k, null) : q.eq(k, v as string);
      }
      if (opts.orderBy) q = q.order(opts.orderBy.column, { ascending: opts.orderBy.ascending ?? true, nullsFirst: false });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) fail("list", table, error);
      return (data ?? []) as Row<T>[];
    },

    async get<T extends TableName>(table: T, id: string) {
      const { data, error } = await db.from(table).select("*").eq("id", id).maybeSingle();
      if (error) fail("get", table, error);
      return (data ?? null) as Row<T> | null;
    },

    async insert<T extends TableName>(table: T, rows: NewRow<T>[]) {
      if (rows.length === 0) return [];
      const { data, error } = await db.from(table).insert(rows as never).select("*");
      if (error) fail("insert", table, error);
      return (data ?? []) as Row<T>[];
    },

    async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
      const { data, error } = await db.from(table).update(patch as never).eq("id", id).select("*").single();
      if (error) fail("update", table, error);
      return data as Row<T>;
    },

    async remove<T extends TableName>(table: T, id: string) {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) fail("delete", table, error);
    },
  };
}
