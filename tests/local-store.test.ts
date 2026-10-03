import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createLocalStore } from "../src/lib/db/local.ts";

test("local store CRUD, filtering and ordering", async () => {
  const store = createLocalStore(path.join(mkdtempSync(path.join(tmpdir(), "stryn-")), "db.json"));
  const rows = await Promise.all(
    ["b", "a", "c"].map((text, i) =>
      store.insert("commitments", [
        { client_id: "x", session_id: null, owner: "client", text, due_date: i === 2 ? null : `2026-01-0${i + 1}`, status: "open", completed_at: null },
      ]),
    ),
  );
  assert.equal(rows.flat().length, 3);
  const ordered = await store.list("commitments", { orderBy: { column: "due_date" } });
  assert.deepEqual(ordered.map((r) => r.text), ["b", "a", "c"]); // nulls last
  const id = ordered[0].id;
  await store.update("commitments", id, { status: "done" });
  assert.equal((await store.list("commitments", { where: { status: "open" } })).length, 2);
  await store.remove("commitments", id);
  assert.equal(await store.get("commitments", id), null);
});
