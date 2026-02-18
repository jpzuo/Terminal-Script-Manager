/**
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-18 00:00:00
 * @LastEditors: ZJP
 * @LastEditTime: 2026-02-18 00:00:00
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src\store\terminal.ts
 * @Description: 终端配置管理模块，负责终端类型的选择和持久化存储
 */

import { Store } from '@tauri-apps/plugin-store';
import { TerminalType } from '../types/terminal';

/** 终端配置存储键名 */
const TERMINAL_TYPE_KEY = 'terminal-type';

/** 终端配置 store 实例 */
let store: Store | null = null;

/**
 * 初始化终端配置 store
 * @returns {Promise<Store>} Store 实例
 */
async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}

/**
 * 获取当前终端类型
 * @returns {Promise<TerminalType>} 当前终端类型，默认为 'cmd'
 * @example
 * const terminalType = await terminalStore.getTerminalType();
 * console.log(terminalType); // 'cmd' 或 'powershell'
 */
async function getTerminalType(): Promise<TerminalType> {
  try {
    const store = await getStore();
    const terminalType = await store.get<TerminalType>(TERMINAL_TYPE_KEY);
    return terminalType || 'cmd';
  } catch (error) {
    console.error('获取终端类型失败:', error);
    return 'cmd';
  }
}

/**
 * 设置终端类型
 * @param {TerminalType} terminalType - 要设置的终端类型
 * @returns {Promise<void>}
 * @example
 * await terminalStore.setTerminalType('powershell');
 */
async function setTerminalType(terminalType: TerminalType): Promise<void> {
  try {
    const store = await getStore();
    await store.set(TERMINAL_TYPE_KEY, terminalType);
    await store.save();
  } catch (error) {
    console.error('设置终端类型失败:', error);
    throw error;
  }
}

export const terminalStore = {
  getTerminalType,
  setTerminalType,
};
