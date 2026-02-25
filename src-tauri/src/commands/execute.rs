/**
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-25 11:04:50
 * @LastEditors: 左金谱
 * @LastEditTime: 2026-02-25 11:04:50
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src-tauri\src\commands\execute.rs
 * @Description: 命令执行入口，根据终端类型生成脚本并启动终端
 */
use std::process::Command as ProcessCommand;
use std::fs;
use std::env;
use crate::commands::validate::get_validator;

#[tauri::command(rename_all = "camelCase")]
/**
 * 执行命令并根据终端类型启动终端
 * @param {String} command - 命令内容
 * @param {Option<String>} terminal_type - 终端类型
 * @returns {Result<String, String>} 执行结果
 * @example
 * // 执行命令
 * execute_command("echo hi".to_string(), Some("cmd".to_string()));
 */
pub fn execute_command(command: String, terminal_type: Option<String>) -> Result<String, String> {
    // 使用全局单例验证器
    let validator = get_validator();

    validator.validate(&command)?;

    // 重要：根据平台选择合适的命令预处理策略
    #[cfg(target_os = "windows")]
    let sanitized = validator.sanitize_for_windows_script(&command);
    #[cfg(not(target_os = "windows"))]
    let sanitized = validator.sanitize(&command);

    // 验证 sanitize 后的长度
    validator.validate_sanitized(&sanitized)?;

    #[cfg(target_os = "windows")]
    {
        // 获取终端类型，默认为 cmd
        let term_type = terminal_type.unwrap_or_else(|| "cmd".to_string());
        match term_type.as_str() {
            "powershell" => execute_powershell(&sanitized)?,
            _ => execute_cmd(&sanitized)?,
        }
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!(
            "tell app \"Terminal\" to do script \"{}\"",
            sanitized.replace("\"", "\\\"")
        );

        ProcessCommand::new("osascript")
            .arg("-e")
            .arg(&script)
            .spawn()
            .map_err(|e| format!("执行失败: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let full_command = format!("{}; exec bash", sanitized);
        ProcessCommand::new("gnome-terminal")
            .arg("--")
            .arg("bash")
            .arg("-c")
            .arg(&full_command)
            .spawn()
            .map_err(|e| format!("执行失败: {}", e))?;
    }

    Ok("命令已执行".to_string())
}

#[cfg(target_os = "windows")]
/**
 * 使用 CMD 执行命令
 * @param {&str} sanitized - 清理后的命令
 * @returns {Result<(), String>} 执行结果
 * @example
 * // 执行 CMD 命令
 * execute_cmd("echo hi");
 */
fn execute_cmd(sanitized: &str) -> Result<(), String> {
    // 创建临时批处理文件来执行多行命令
    let temp_dir = env::temp_dir();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let batch_file = temp_dir.join(format!("tauri_cmd_{}.bat", timestamp));

    // 写入批处理文件，使用 Windows 换行符
    // 添加 chcp 65001 支持 UTF-8
    let batch_content = format!(
        "@echo off\r\nchcp 65001 >nul\r\n{}\r\necho.\r\necho 命令执行完成\r\npause\r\ndel \"%~f0\"",
        sanitized.replace("\n", "\r\n")
    );

    fs::write(&batch_file, batch_content)
        .map_err(|e| format!("创建批处理文件失败: {}", e))?;

    // 直接执行批处理文件
    // 使用空标题避免 Windows start 命令的解析问题
    let batch_path = batch_file.to_string_lossy().to_string();
    ProcessCommand::new("cmd")
        .arg("/c")
        .arg("start")
        .arg("")  // 空标题，避免中文标题导致的解析问题
        .arg("cmd")
        .arg("/k")
        .arg(&batch_path)
        .spawn()
        .map_err(|e| format!("执行失败: {}", e))?;

    Ok(())
}

#[cfg(target_os = "windows")]
/**
 * 使用 PowerShell 执行命令
 * @param {&str} sanitized - 清理后的命令
 * @returns {Result<(), String>} 执行结果
 * @example
 * // 执行 PowerShell 命令
 * execute_powershell("Get-Process");
 */
fn execute_powershell(sanitized: &str) -> Result<(), String> {
    // 创建临时 PowerShell 脚本文件
    let temp_dir = env::temp_dir();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let script_file = temp_dir.join(format!("tauri_ps_{}.ps1", timestamp));

    // 写入 PowerShell 脚本
    // 设置输出编码确保中文正确显示
    let script_content = format!(
        "# PowerShell Script\n[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n$OutputEncoding = [System.Text.Encoding]::UTF8\n\n{}",
        sanitized
    );

    // 使用 UTF-8 BOM 编码写入文件（PowerShell 需要 BOM 识别 UTF-8）
    let utf8_bom = vec![0xEF, 0xBB, 0xBF];
    let mut file_content = utf8_bom;
    file_content.extend_from_slice(script_content.as_bytes());

    fs::write(&script_file, file_content)
        .map_err(|e| format!("创建 PowerShell 脚本文件失败: {}", e))?;

    // 启动新的 PowerShell 窗口执行脚本
    // 使用 -NoExit 参数保持窗口打开
    let script_path = script_file.to_string_lossy().to_string();
    ProcessCommand::new("cmd")
        .arg("/c")
        .arg("start")
        .arg("")  // 空标题
        .arg("powershell")
        .arg("-NoExit")
        .arg("-NoProfile")
        .arg("-ExecutionPolicy")
        .arg("Bypass")
        .arg("-File")
        .arg(&script_path)
        .spawn()
        .map_err(|e| format!("执行失败: {}", e))?;

    Ok(())
}
