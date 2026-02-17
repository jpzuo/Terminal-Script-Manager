export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ExportData {
  version: string;
  exportedAt: number;
  commands: any[];
  groups: any[];
}

export interface ImportResult {
  success: boolean;
  commandsImported: number;
  groupsImported: number;
  errors: string[];
}
