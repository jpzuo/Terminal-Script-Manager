import { LazyStore } from "@tauri-apps/plugin-store";

const DEFAULT_BACKUP_STORE = "commands";
const MAX_BACKUPS = 5;
const stores = new Map<string, LazyStore>();

interface Backup {
  data: unknown;
  timestamp: number;
}

function getBackupStore(storeName: string): LazyStore {
  const key = storeName || DEFAULT_BACKUP_STORE;
  const existing = stores.get(key);
  if (existing) {
    return existing;
  }

  const store = new LazyStore(`${key}.backup.json`);
  stores.set(key, store);
  return store;
}

export async function createBackup(
  data: unknown,
  storeName: string = DEFAULT_BACKUP_STORE
): Promise<void> {
  try {
    const backupStore = getBackupStore(storeName);
    const backups = (await backupStore.get<Backup[]>("backups")) || [];
    backups.unshift({
      data,
      timestamp: Date.now(),
    });

    if (backups.length > MAX_BACKUPS) {
      backups.splice(MAX_BACKUPS);
    }

    await backupStore.set("backups", backups);
    await backupStore.save();
  } catch (error) {
    console.error("创建备份失败:", error);
  }
}

export async function restoreFromBackup(
  storeName: string = DEFAULT_BACKUP_STORE
): Promise<unknown> {
  try {
    const backupStore = getBackupStore(storeName);
    const backups = (await backupStore.get<Backup[]>("backups")) || [];
    if (backups.length === 0) {
      throw new Error("没有可用的备份");
    }

    return backups[0].data;
  } catch (error) {
    console.error("恢复备份失败:", error);
    throw error;
  }
}

export async function getBackupList(
  storeName: string = DEFAULT_BACKUP_STORE
): Promise<Backup[]> {
  try {
    const backupStore = getBackupStore(storeName);
    return (await backupStore.get<Backup[]>("backups")) || [];
  } catch (error) {
    console.error("获取备份列表失败:", error);
    return [];
  }
}
