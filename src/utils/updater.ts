/*
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-17 00:00:00
 * @LastEditors: ZJP
 * @LastEditTime: 2026-02-17 00:00:00
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src\utils\updater.ts
 * @Description: 应用更新检查模块
 */

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

/**
 * 检查并安装更新
 * @returns {Promise<boolean>} 是否有可用更新
 * @example
 * const hasUpdate = await checkForUpdates();
 */
export async function checkForUpdates(): Promise<boolean> {
  try {
    const update = await check();

    if (update?.available) {
      const shouldUpdate = confirm(
        `发现新版本 ${update.version}！\n\n` +
        `当前版本: ${update.currentVersion}\n` +
        `是否立即更新？`
      );

      if (shouldUpdate) {
        console.log('开始下载更新...');
        await update.downloadAndInstall();

        const shouldRelaunch = confirm('更新已完成！是否立即重启应用？');
        if (shouldRelaunch) {
          await relaunch();
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('检查更新失败:', error);
    return false;
  }
}

/**
 * 静默检查更新（不弹窗提示）
 * @returns {Promise<boolean>} 是否有可用更新
 */
export async function checkForUpdatesSilently(): Promise<boolean> {
  try {
    const update = await check();
    return update?.available || false;
  } catch (error) {
    console.error('检查更新失败:', error);
    return false;
  }
}
