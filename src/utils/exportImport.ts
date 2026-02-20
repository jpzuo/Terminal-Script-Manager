import { Command } from "../types/command";
import { Group } from "../types/group";
import { ExportData, ImportResult } from "../types/common";

export async function exportData(
  commands: Command[],
  groups: Group[]
): Promise<string> {
  const data: ExportData = {
    version: "1.0.6",
    exportedAt: Date.now(),
    commands,
    groups,
  };

  return JSON.stringify(data, null, 2);
}

export async function downloadExport(
  commands: Command[],
  groups: Group[]
): Promise<void> {
  const data = await exportData(commands, groups);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `commands-export-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export async function importData(
  jsonString: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    commandsImported: 0,
    groupsImported: 0,
    errors: [],
  };

  try {
    const data: ExportData = JSON.parse(jsonString);

    if (
      !data.version ||
      !Array.isArray(data.commands) ||
      !Array.isArray(data.groups)
    ) {
      throw new Error("无效的导入文件格式");
    }

    result.commandsImported = data.commands.length;
    result.groupsImported = data.groups.length;
    result.success = true;
  } catch (error) {
    result.errors.push(String(error));
  }

  return result;
}
