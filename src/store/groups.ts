import { LazyStore } from "@tauri-apps/plugin-store";
import { Group } from "../types/group";
import { createBackup, restoreFromBackup } from "./backup";

const store = new LazyStore("groups.json");
const STORE_KEY = "groups";

export const groupStore = {
  async saveWithBackup(groups: Group[]): Promise<void> {
    try {
      const currentData = await this.getAll();
      await createBackup(currentData, "groups");

      await store.set(STORE_KEY, groups);
      await store.save();

      const saved = await store.get<Group[]>(STORE_KEY);
      if (!saved || saved.length !== groups.length) {
        throw new Error("数据验证失败");
      }
    } catch (error) {
      console.error("保存失败，正在回滚:", error);
      const backupData = await restoreFromBackup("groups");
      if (Array.isArray(backupData)) {
        await store.set(STORE_KEY, backupData as Group[]);
        await store.save();
      }
      throw error;
    }
  },

  async getAll(): Promise<Group[]> {
    try {
      const groups = await store.get<Group[]>(STORE_KEY);
      return groups || [];
    } catch (error) {
      console.error("读取分组失败:", error);
      return [];
    }
  },

  async add(group: Omit<Group, "id" | "createdAt">): Promise<Group> {
    const groups = await this.getAll();
    const newGroup: Group = {
      ...group,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    groups.push(newGroup);
    await this.saveWithBackup(groups);
    return newGroup;
  },

  async bulkAdd(groups: Group[]): Promise<void> {
    if (groups.length === 0) {
      return;
    }

    const existing = await this.getAll();
    const merged = [...existing, ...groups];
    await this.saveWithBackup(merged);
  },

  async replaceAll(groups: Group[]): Promise<void> {
    await this.saveWithBackup(groups);
  },

  async update(id: string, updates: Partial<Group>): Promise<void> {
    const groups = await this.getAll();
    const index = groups.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error(`分组不存在: ${id}`);
    }
    groups[index] = { ...groups[index], ...updates };
    await this.saveWithBackup(groups);
  },

  async delete(id: string): Promise<void> {
    const groups = await this.getAll();
    const filtered = groups.filter((g) => g.id !== id);
    if (filtered.length === groups.length) {
      throw new Error(`分组不存在: ${id}`);
    }
    await this.saveWithBackup(filtered);
  },
};
