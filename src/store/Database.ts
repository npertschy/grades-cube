import Database from "@tauri-apps/plugin-sql";
import { appLocalDataDir } from "@tauri-apps/api/path";

const path = (await appLocalDataDir()) + "/db/Notenwuerfel.sqlite";
export const db = await Database.load("sqlite:" + path);
