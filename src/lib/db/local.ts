import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { TableName } from "@/lib/types";
import type { ListOptions, NewRow, Row, Store } from "./types";

type Data = { [K in TableName]: Row<K>[] };

const EMPTY: Data = {
  clients: [],
  sessions: [],
  commitments: [],
  journal_entries: [],
  theme_mentions: [],
  content_items: [],
  assets: [],
  pattern_briefs: [],
};

/**
 * Zero-setup JSON file store for local use before Supabase is configured.
 * Fine for a single operator; swap to Supabase by setting the env vars.
 */
export function createLocalStore(file = process.env.STRYN_DATA_FILE ?? ".data/stryn.json"): Store {
  const filePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), file);
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<Data> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return { ...EMPTY, ...JSON.parse(raw) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
      throw err;
    }
  }

  async function write(data: Data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, filePath);
  }

  // Serialise read-modify-write cycles within this process.
  function mutate<R>(fn: (data: Data) => R): Promise<R> {
    const next = queue.then(async () => {
      const data = await read();
      const result = fn(data);
      await write(data);
      return result;
    });
    queue = next.catch(() => undefined);
    return next;
  }

  return {
    kind: "local",

    async list<T extends TableName>(table: T, opts: ListOptions<T> = {}) {
      const data = await read();
      let rows = data[table] as Row<T>[];
      if (opts.where) {
        const entries = Object.entries(opts.where);
        rows = rows.filter((r) => entries.every(([k, v]) => (r as unknown as Record<string, unknown>)[k] === v));
      }
      if (opts.orderBy) {
        const { column, ascending = true } = opts.orderBy;
        rows = [...rows].sort((a, b) => {
          const av = a[column] as unknown as string | number | null;
          const bv = b[column] as unknown as string | number | null;
          if (av === bv) return 0;
          if (av === null || av === undefined) return 1;
          if (bv === null || bv === undefined) return -1;
          return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
        });
      }
      return opts.limit ? rows.slice(0, opts.limit) : rows;
    },

    async get<T extends TableName>(table: T, id: string) {
      const data = await read();
      return ((data[table] as Row<T>[]).find((r) => r.id === id) ?? null) as Row<T> | null;
    },

    insert<T extends TableName>(table: T, rows: NewRow<T>[]) {
      return mutate((data) => {
        const now = new Date().toISOString();
        const created = rows.map((r) => ({ id: randomUUID(), created_at: now, ...r }) as Row<T>);
        (data[table] as Row<T>[]).push(...created);
        return created;
      });
    },

    update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
      return mutate((data) => {
        const rows = data[table] as Row<T>[];
        const i = rows.findIndex((r) => r.id === id);
        if (i === -1) throw new Error(`${table} ${id} not found`);
        rows[i] = { ...rows[i], ...patch, id };
        return rows[i];
      });
    },

    remove<T extends TableName>(table: T, id: string) {
      return mutate((data) => {
        (data as Record<string, { id: string }[]>)[table] = (data[table] as Row<T>[]).filter((r) => r.id !== id);
      });
    },
  };
}
