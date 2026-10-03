import type { TableName, Tables } from "@/lib/types";

export type Row<T extends TableName> = Tables[T];
export type NewRow<T extends TableName> = Omit<Row<T>, "id" | "created_at"> &
  Partial<Pick<Row<T>, "id" | "created_at">>;

export interface ListOptions<T extends TableName> {
  where?: Partial<Row<T>>;
  orderBy?: { column: keyof Row<T> & string; ascending?: boolean };
  limit?: number;
}

/**
 * The narrow storage contract. Everything domain-specific lives above this,
 * so the local JSON store and Supabase behave identically.
 */
export interface Store {
  kind: "local" | "supabase";
  list<T extends TableName>(table: T, opts?: ListOptions<T>): Promise<Row<T>[]>;
  get<T extends TableName>(table: T, id: string): Promise<Row<T> | null>;
  insert<T extends TableName>(table: T, rows: NewRow<T>[]): Promise<Row<T>[]>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>>;
  remove<T extends TableName>(table: T, id: string): Promise<void>;
}
