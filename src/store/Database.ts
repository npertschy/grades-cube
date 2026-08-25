import Database from "@tauri-apps/plugin-sql";
import { type ZEntId } from "./EntityId";

// NOTE: tauri-plugin-sql connects through an SQLx pool (default max 10 connections).
// Only `mode`, `cache`, `immutable` and `vfs` are valid URL query params; any other
// param (e.g. `busy_timeout`) makes SQLx reject the connection string. SQLx already
// applies sane per-connection defaults (busy_timeout = 5s, foreign_keys = ON) and
// WAL mode is enabled once via a migration (persisted in the database file header).
export const db = await Database.load("sqlite:db/Notenwuerfel.sqlite?mode=rwc");

type PrimaryKey = {
  Z_ENT: number;
  Z_NAME: string;
  Z_SUPER: number;
  Z_MAX: number;
};

export type CountResult = {
  "COUNT(*)": number;
};

export async function nextPrimaryKey(entityId: ZEntId): Promise<number> {
  // Atomic read-modify-write in a single statement. This avoids the race that the
  // previous SELECT-then-UPDATE pair had, and works safely across the connection
  // pool because it is one self-contained statement on one connection.
  const result: PrimaryKey[] = await db.select(
    "UPDATE Z_PRIMARYKEY SET Z_MAX = Z_MAX + 1 WHERE Z_ENT = $1 RETURNING Z_MAX",
    [entityId],
  );
  return result[0].Z_MAX;
}

let operationQueue: Promise<unknown> = Promise.resolve();

/**
 * Serializes a group of related database writes so they cannot interleave with
 * other operations.
 *
 * IMPORTANT: This does NOT open a SQL transaction. tauri-plugin-sql runs on an
 * SQLx connection pool, so a `BEGIN`/`COMMIT` issued through separate `db.execute`
 * calls would land on different physical connections — leaving a dangling
 * transaction (causing "transaction within a transaction") and an unreleased
 * exclusive lock (causing "database is locked"). Because the plugin exposes no way
 * to pin a single connection, we rely on WAL mode plus this global queue to keep
 * related statements ordered and non-interleaved.
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(fn, fn);
  // Swallow errors in the queue chain so one failed operation doesn't block later ones.
  operationQueue = result.catch(() => undefined);
  return result;
}

export function orQuery(ids: number[], column: string, offset: number) {
  return ids
    .map((_value, index) => {
      return `${column} = $` + (index + offset);
    })
    .join(" OR ");
}
