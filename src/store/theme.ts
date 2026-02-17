/*
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-17 00:00:00
 * @LastEditors: ZJP
 * @LastEditTime: 2026-02-17 00:00:00
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src\store\theme.ts
 * @Description: 主题管理模块，负责主题的切换和持久化存储
 */

import { Store } from '@tauri-apps/plugin-store';

/** 主题类型 */
export type Theme = 'light' | 'dark';

/** 主题存储键名 */
const THEME_KEY = 'app-theme';

/** 主题 store 实例 */
let store: Store | null = null;

/**
 * 初始化主题 store
 * @returns {Promise<Store>} Store 实例
 */
async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}

/**
 * 获取当前主题
 * @returns {Promise<Theme>} 当前主题，默认为 'dark'
 * @example
 * const theme = await themeStore.getTheme();
 * console.log(theme); // 'light' 或 'dark'
 */
async function getTheme(): Promise<Theme> {
  try {
    const store = await getStore();
    const theme = await store.get<Theme>(THEME_KEY);
    return theme || 'dark';
  } catch (error) {
    console.error('获取主题失败:', error);
    return 'dark';
  }
}

/**
 * 设置主题
 * @param {Theme} theme - 要设置的主题
 * @returns {Promise<void>}
 * @example
 * await themeStore.setTheme('dark');
 */
async function setTheme(theme: Theme): Promise<void> {
  try {
    const store = await getStore();
    await store.set(THEME_KEY, theme);
    await store.save();

    // 同时保存到 localStorage 作为缓存，用于快速加载避免闪烁
    try {
      localStorage.setItem('app-theme-cache', theme);
    } catch (e) {
      console.error('保存主题缓存失败:', e);
    }
  } catch (error) {
    console.error('设置主题失败:', error);
    throw error;
  }
}

/**
 * 切换主题
 * @returns {Promise<Theme>} 切换后的主题
 * @example
 * const newTheme = await themeStore.toggleTheme();
 * console.log(newTheme); // 'dark' 或 'light'
 */
async function toggleTheme(): Promise<Theme> {
  try {
    const currentTheme = await getTheme();
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
    return newTheme;
  } catch (error) {
    console.error('切换主题失败:', error);
    throw error;
  }
}

export const themeStore = {
  getTheme,
  setTheme,
  toggleTheme,
};
