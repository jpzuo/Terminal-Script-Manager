import { Store } from "@tauri-apps/plugin-store";
import { Group } from "../types/group";

const store = new Store("groups.json");
const STORE_KEY = "groups";

export const groupStore = {
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
    await store.set(STORE_KEY, groups);
    await store.save();
    return newGroup;
  },

  async update(id: string, updates: Partial<Group>): Promise<void> {
    const groups = await this.getAll();
    const index = groups.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error(`分组不存在: ${id}`);
    }
    groups[index] = { ...groups[index], ...updates };
    await store.set(STORE_KEY, groups);
    await store.save();
  },

  async delete(id: string): Promise<void> {
    const groups = await this.getAll();
    const filtered = groups.filter((g) => g.id !== id);
    if (filtered.length === groups.length) {
      throw new Error(`分组不存在: ${id}`);
    }
    await store.set(STORE_KEY, filtered);
    await store.save();
  },
};
