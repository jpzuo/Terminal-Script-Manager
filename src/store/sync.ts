import { Store } from '@tauri-apps/plugin-store';

const SETTINGS_FILE = 'settings.json';
const TOKEN_KEY = 'github-token';
const GIST_ID_KEY = 'github-gist-id';
const LAST_EXPORTED_AT_KEY = 'sync-last-exported-at';
const LAST_HASH_KEY = 'sync-last-hash';

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load(SETTINGS_FILE);
  }
  return store;
}

async function getToken(): Promise<string> {
  try {
    const store = await getStore();
    return (await store.get<string>(TOKEN_KEY)) || '';
  } catch (error) {
    console.error('读取 GitHub Token 失败:', error);
    return '';
  }
}

async function setToken(token: string): Promise<void> {
  const store = await getStore();
  await store.set(TOKEN_KEY, token);
  await store.save();
}

async function getGistId(): Promise<string> {
  try {
    const store = await getStore();
    return (await store.get<string>(GIST_ID_KEY)) || '';
  } catch (error) {
    console.error('读取 Gist ID 失败:', error);
    return '';
  }
}

async function setGistId(gistId: string): Promise<void> {
  const store = await getStore();
  await store.set(GIST_ID_KEY, gistId);
  await store.save();
}

async function getLastExportedAt(): Promise<number> {
  try {
    const store = await getStore();
    return (await store.get<number>(LAST_EXPORTED_AT_KEY)) || 0;
  } catch (error) {
    console.error('读取最近导出时间失败:', error);
    return 0;
  }
}

async function setLastExportedAt(exportedAt: number): Promise<void> {
  const store = await getStore();
  await store.set(LAST_EXPORTED_AT_KEY, exportedAt);
  await store.save();
}

async function getLastHash(): Promise<string> {
  try {
    const store = await getStore();
    return (await store.get<string>(LAST_HASH_KEY)) || '';
  } catch (error) {
    console.error('读取同步哈希失败:', error);
    return '';
  }
}

async function setLastHash(hash: string): Promise<void> {
  const store = await getStore();
  await store.set(LAST_HASH_KEY, hash);
  await store.save();
}

export const syncStore = {
  getToken,
  setToken,
  getGistId,
  setGistId,
  getLastExportedAt,
  setLastExportedAt,
  getLastHash,
  setLastHash,
};
