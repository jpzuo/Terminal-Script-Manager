import { ValidationResult } from "../types/common";

export function validateCommand(command: string): ValidationResult {
  const errors: string[] = [];

  if (!command.trim()) {
    errors.push("命令不能为空");
  }

  if (command.length > 1000) {
    errors.push("命令过长（最多 1000 字符）");
  }

  const dangerousChars = /[;&|`$(){}[\]<>]/;
  if (dangerousChars.test(command)) {
    errors.push("命令包含不安全字符");
  }

  const dangerousCommands = ["rm -rf", "sudo", "eval", "exec"];
  for (const dangerous of dangerousCommands) {
    if (command.toLowerCase().includes(dangerous)) {
      errors.push(`命令包含危险操作: ${dangerous}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCommandName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push("命令名称不能为空");
  }

  if (name.length > 50) {
    errors.push("命令名称过长（最多 50 字符）");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
