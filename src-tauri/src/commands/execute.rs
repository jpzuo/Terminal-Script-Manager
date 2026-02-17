use std::process::Command as ProcessCommand;
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
        // 简化参数传递，减少栈上数组分配
        ProcessCommand::new("cmd")
            .arg("/c")
            .arg("start")
            .arg("")  // 窗口标题（必须）
            .arg("cmd")
            .arg("/k")
            .arg(&sanitized)
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
