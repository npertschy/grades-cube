import { Store } from "@tauri-apps/plugin-store";
import { appLocalDataDir } from "@tauri-apps/api/path";

const path = await appLocalDataDir() + "/store.bin";
const store = new Store(path);

export default store;
