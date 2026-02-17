use std::process::Command as ProcessCommand;
use std::fs;
use std::env;
use crate::commands::validate::get_validator;

#[tauri::command]
pub fn execute_command(command: String) -> Result<String, String> {
    // 使用全局单例验证器
    let validator = get_validator();

    validator.validate(&command)?;

    let sanitized = validator.sanitize(&command);

    // 验证 sanitize 后的长度
    validator.validate_sanitized(&sanitized)?;

    #[cfg(target_os = "windows")]
    {
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
