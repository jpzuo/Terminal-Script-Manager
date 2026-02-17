import { Command } from '../types/command';
import { Group } from '../types/group';
import { ExportData, ValidationResult } from '../types/common';

const APP_VERSION = '1.0.0';

/**
 * 导出命令和分组数据为 JSON
 */
export function exportToJSON(commands: Command[], groups: Group[]): ExportData {
  return {
    version: APP_VERSION,
    exportedAt: Date.now(),
    commands,
    groups,
  };
}

/**
 * 验证导入的数据格式
 */
export function validateImportData(data: any): ValidationResult {
  const errors: string[] = [];

  // 检查必需字段
  if (!data.version) {
    errors.push('缺少版本信息');
  }

  if (!data.exportedAt || typeof data.exportedAt !== 'number') {
    errors.push('缺少或无效的导出时间戳');
  }

  if (!Array.isArray(data.commands)) {
    errors.push('commands 必须是数组');
  } else {
    // 验证每个命令的结构
    data.commands.forEach((cmd: any, index: number) => {
      if (!cmd.id || typeof cmd.id !== 'string') {
        errors.push(`命令 ${index}: 缺少或无效的 id`);
      }
      if (!cmd.name || typeof cmd.name !== 'string') {
        errors.push(`命令 ${index}: 缺少或无效的 name`);
      }
      if (!cmd.command || typeof cmd.command !== 'string') {
        errors.push(`命令 ${index}: 缺少或无效的 command`);
      }
      if (!Array.isArray(cmd.tags)) {
        errors.push(`命令 ${index}: tags 必须是数组`);
      }
      if (typeof cmd.createdAt !== 'number') {
        errors.push(`命令 ${index}: 缺少或无效的 createdAt`);
      }
    });
  }

  if (!Array.isArray(data.groups)) {
    errors.push('groups 必须是数组');
  } else {
    // 验证每个分组的结构
    data.groups.forEach((group: any, index: number) => {
      if (!group.id || typeof group.id !== 'string') {
        errors.push(`分组 ${index}: 缺少或无效的 id`);
      }
      if (!group.name || typeof group.name !== 'string') {
        errors.push(`分组 ${index}: 缺少或无效的 name`);
      }
      if (typeof group.createdAt !== 'number') {
        errors.push(`分组 ${index}: 缺少或无效的 createdAt`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 处理导入数据，重新生成 ID 避免冲突
 */
export function processImportData(
  data: ExportData,
  existingCommands: Command[],
  existingGroups: Group[]
): { commands: Command[]; groups: Group[] } {
  // 创建 ID 映射表（旧 ID -> 新 ID）
  const groupIdMap = new Map<string, string>();
  const existingGroupIds = new Set(existingGroups.map(g => g.id));
  const existingCommandIds = new Set(existingCommands.map(c => c.id));

  // 处理分组：重新生成 ID
  const processedGroups: Group[] = data.groups.map(group => {
    let newId = group.id;

    // 如果 ID 冲突，生成新 ID
    if (existingGroupIds.has(group.id)) {
      newId = crypto.randomUUID();
    }

    groupIdMap.set(group.id, newId);
    existingGroupIds.add(newId);

    return {
      ...group,
      id: newId,
    };
  });

  // 处理命令：重新生成 ID，更新 groupId 引用
  const processedCommands: Command[] = data.commands.map(cmd => {
    let newId = cmd.id;

    // 如果 ID 冲突，生成新 ID
    if (existingCommandIds.has(cmd.id)) {
      newId = crypto.randomUUID();
    }

    existingCommandIds.add(newId);

    // 更新 groupId 引用
    let newGroupId = cmd.groupId;
    if (cmd.groupId && groupIdMap.has(cmd.groupId)) {
      newGroupId = groupIdMap.get(cmd.groupId)!;
    }

    return {
      ...cmd,
      id: newId,
      groupId: newGroupId,
    };
  });

  return {
    commands: processedCommands,
    groups: processedGroups,
  };
}

/**
 * 下载 JSON 文件
 */
export function downloadJSON(data: ExportData, filename: string = 'commands-export.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * 读取 JSON 文件
 */
export function readJSONFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        resolve(data);
      } catch (error) {
        reject(new Error('JSON 解析失败'));
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsText(file);
  });
}
