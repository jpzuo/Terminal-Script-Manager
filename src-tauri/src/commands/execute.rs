use std::process::Command as ProcessCommand;
use crate::commands::validate::CommandValidator;

#[tauri::command]
pub fn execute_command(command: String) -> Result<String, String> {
    let validator = CommandValidator::new();

    validator.validate(&command)?;

    let sanitized = validator.sanitize(&command);

    #[cfg(target_os = "windows")]
    {
        ProcessCommand::new("cmd")
            .args(["/c", "start", "cmd", "/k"])
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
