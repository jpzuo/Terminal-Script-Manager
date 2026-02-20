import { Command } from './command';
import { Group } from './group';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ExportData {
  version: string;
  exportedAt: number;
  commands: Command[];
  groups: Group[];
}

export interface ImportResult {
  success: boolean;
  commandsImported: number;
  groupsImported: number;
  errors: string[];
}
