import { Store } from "@tauri-apps/plugin-store";

const backupStore = new Store("commands.backup.json");
const MAX_BACKUPS = 5;

interface Backup {
  data: any;
  timestamp: number;
}

export async function createBackup(data: any): Promise<void> {
  try {
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

export async function restoreFromBackup(): Promise<any> {
  try {
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

export async function getBackupList(): Promise<Backup[]> {
  try {
    return (await backupStore.get<Backup[]>("backups")) || [];
  } catch (error) {
    console.error("获取备份列表失败:", error);
    return [];
  }
}
