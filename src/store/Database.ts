import Database from "@tauri-apps/plugin-sql";
import { appLocalDataDir } from "@tauri-apps/api/path";

const path = (await appLocalDataDir()) + "/db/Notenwuerfel.sqlite";
export const db = await Database.load("sqlite:" + path);

type PrimaryKey = {
    Z_ENT: number,
    Z_NAME: string,
    Z_SUPER: number,
    Z_MAX: number
}

export type CountResult = {
    "COUNT(*)": number
}

export async function nextPrimaryKey(name: string): Promise<number> {
    const result: PrimaryKey = await db.select("SELECT Z_MAX FROM Z_PRIMARYKEY WHERE Z_NAME = $1", [name]);
    const nextId = result.Z_MAX + 1;
    await db.execute("UPDATE Z_PRIMARYKEY SET Z_MAX = $1 WHERE Z_NAME = $2", [nextId, name]);
    return nextId;
}

export async function execute(query: string, bindValues: unknown[] | undefined) {
    return await db.execute(query, bindValues);
}

// export class DbClient {

//     private db: Database | undefined;

//     constructor() {
//         appLocalDataDir()
//             .then(path => {
//                 const dbPath = path + + "/db/Notenwuerfel.sqlite";
//                 Database.load(dbPath)
//                     .then(db => {
//                         this.db = db;
//                     })
//             })
//     }

//     async select(query: string, bindValues: unknown[] | undefined) {
//         return this.db!.select(query, bindValues);
//     }

//     async execute(query: string, bindValues: unknown[] | undefined) {
//         return this.db!.execute(query, bindValues);
//     }

//     async nextPrimaryKey(name: string): Promise<number> {
//         const result: PrimaryKey = await this.db!.select("SELECT Z_MAX FROM Z_PRIMARYKEY WHERE Z_NAME = $1", [name]);
//         const nextId = result.Z_MAX + 1;
//         await this.db!.execute("UPDATE Z_PRIMARYKEY SET Z_MAX = $1 WHERE Z_NAME = $2", [nextId, name]);
//         return nextId;
//     }
// }
