import { invoke } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";
import { Command } from "../types/command";
import { createBackup, restoreFromBackup } from "./backup";

const store = new LazyStore("commands.json");
const STORE_KEY = "commands";

export const commandStore = {
  async saveWithBackup(commands: Command[]): Promise<void> {
    try {
      const currentData = await this.getAll();
      await createBackup(currentData);

      await store.set(STORE_KEY, commands);
      await store.save();

      const saved = await store.get<Command[]>(STORE_KEY);
      if (!saved || saved.length !== commands.length) {
        throw new Error("数据验证失败");
      }
    } catch (error) {
      console.error("保存失败，正在回滚:", error);
      const backupData = await restoreFromBackup();
      if (backupData) {
        await store.set(STORE_KEY, backupData);
        await store.save();
      }
      throw error;
    }
  },

  async getAll(): Promise<Command[]> {
    try {
      const commands = await store.get<Command[]>(STORE_KEY);
      return commands || [];
    } catch (error) {
      console.error("读取命令失败:", error);
      return [];
    }
  },

  async add(command: Omit<Command, "id" | "createdAt">): Promise<Command> {
    const commands = await this.getAll();
    const newCommand: Command = {
      ...command,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    commands.push(newCommand);
    await this.saveWithBackup(commands);
    return newCommand;
  },

  async update(id: string, updates: Partial<Command>): Promise<void> {
    const commands = await this.getAll();
    const index = commands.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`命令不存在: ${id}`);
    }
    commands[index] = { ...commands[index], ...updates, updatedAt: Date.now() };
    await this.saveWithBackup(commands);
  },

  async delete(id: string): Promise<void> {
    const commands = await this.getAll();
    const filtered = commands.filter((c) => c.id !== id);
    if (filtered.length === commands.length) {
      throw new Error(`命令不存在: ${id}`);
    }
    await this.saveWithBackup(filtered);
  },

  async execute(command: string): Promise<{ success: boolean; message?: string }> {
    try {
      await invoke("execute_command", { command });
      return { success: true };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  },
};
