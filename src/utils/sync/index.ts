import { commandStore } from '../../store/commands';
import { groupStore } from '../../store/groups';
import { syncStore } from '../../store/sync';
import { ExportData } from '../../types/common';
import { exportToJSON, validateImportData } from '../importExport';
import { createGist, fetchGistContent, updateGist } from './github';

const SYNC_FILENAME = 'terminal-script-manager.json';

export interface SyncSnapshot {
  data: ExportData;
  jsonString: string;
  hash: string;
}

export interface AutoUploadCheck {
  status: 'no-config' | 'no-changes' | 'ready';
  token?: string;
  gistId?: string;
  snapshot?: SyncSnapshot;
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildSnapshot(): Promise<SyncSnapshot> {
  const commands = await commandStore.getAll();
  const groups = await groupStore.getAll();
  const data = exportToJSON(commands, groups);
  const jsonString = JSON.stringify(data, null, 2);
  const hash = await hashString(jsonString);
  return { data, jsonString, hash };
}

async function saveSyncMeta(snapshot: SyncSnapshot): Promise<void> {
  await syncStore.setLastHash(snapshot.hash);
  await syncStore.setLastExportedAt(snapshot.data.exportedAt);
}

export async function createGistForSync(token: string): Promise<{ gistId: string; snapshot: SyncSnapshot }> {
  const snapshot = await buildSnapshot();
  const gistId = await createGist(token, SYNC_FILENAME, snapshot.jsonString);
  await saveSyncMeta(snapshot);
  return { gistId, snapshot };
}

export async function pushToGist(token: string, gistId: string): Promise<SyncSnapshot> {
  const snapshot = await buildSnapshot();
  await updateGist(token, gistId, SYNC_FILENAME, snapshot.jsonString);
  await saveSyncMeta(snapshot);
  return snapshot;
}

export async function pullFromGist(token: string, gistId: string): Promise<{ commands: number; groups: number }> {
  const { content } = await fetchGistContent(token, gistId, SYNC_FILENAME);
  const data = JSON.parse(content) as ExportData;
  const validation = validateImportData(data);
  if (!validation.valid) {
    throw new Error(`导入数据校验失败:\n${validation.errors.join('\n')}`);
  }

  await groupStore.replaceAll(data.groups);
  await commandStore.replaceAll(data.commands);

  const hash = await hashString(content);
  await syncStore.setLastHash(hash);
  await syncStore.setLastExportedAt(data.exportedAt);

  return {
    commands: data.commands.length,
    groups: data.groups.length,
  };
}

export async function checkAutoUpload(): Promise<AutoUploadCheck> {
  const token = (await syncStore.getToken()).trim();
  const gistId = (await syncStore.getGistId()).trim();

  if (!token || !gistId) {
    return { status: 'no-config' };
  }

  const snapshot = await buildSnapshot();
  const lastHash = await syncStore.getLastHash();

  if (lastHash && lastHash === snapshot.hash) {
    return { status: 'no-changes' };
  }

  return {
    status: 'ready',
    token,
    gistId,
    snapshot,
  };
}

export async function uploadSnapshot(
  token: string,
  gistId: string,
  snapshot: SyncSnapshot
): Promise<void> {
  await updateGist(token, gistId, SYNC_FILENAME, snapshot.jsonString);
  await saveSyncMeta(snapshot);
}

export { SYNC_FILENAME };
