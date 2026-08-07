import Database from "@tauri-apps/plugin-sql";
import { appLocalDataDir } from "@tauri-apps/api/path";

const path = (await appLocalDataDir()) + "/db/Notenwuerfel.sqlite";
export const db = await Database.load("sqlite:" + path);

type PrimaryKey = {
  Z_ENT: number;
  Z_NAME: string;
  Z_SUPER: number;
  Z_MAX: number;
};

export type CountResult = {
  "COUNT(*)": number;
};

export async function nextPrimaryKey(name: string): Promise<number> {
  const result: PrimaryKey[] = await db.select("SELECT Z_MAX FROM Z_PRIMARYKEY WHERE Z_NAME = $1", [name]);
  const nextId = result[0].Z_MAX + 1;
  await db.execute("UPDATE Z_PRIMARYKEY SET Z_MAX = $1 WHERE Z_NAME = $2", [nextId, name]);
  return nextId;
}

export function orQuery(ids: number[], column: string, offset: number) {
  return ids
    .map((_value, index) => {
      return `${column} = $` + (index + offset);
    })
    .join(" OR ");
}

export function coreDataToUnix(seconds: number): Date {
  return new Date((seconds + 978307200) * 1000);
}

export function dateToCoreData(date: Date): number {
  return Math.floor(date.getTime() / 1000 - 978307200);
}
