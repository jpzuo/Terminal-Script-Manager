use std::fs;
use std::env;
use std::time::{SystemTime, Duration};

/// 清理旧的临时脚本文件
/// 删除超过 1 小时的 tauri_cmd_*.bat 和 tauri_ps_*.ps1 文件
pub fn cleanup_temp_files() -> Result<(), String> {
    let temp_dir = env::temp_dir();

    // 定义清理阈值：1 小时
    let cleanup_threshold = Duration::from_secs(3600);
    let now = SystemTime::now();

    // 读取临时目录
    let entries = fs::read_dir(&temp_dir)
        .map_err(|e| format!("读取临时目录失败: {}", e))?;

    let mut cleaned_count = 0;

    for entry in entries.flatten() {
        let path = entry.path();

        // 只处理我们的临时文件
        if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
            if filename.starts_with("tauri_cmd_") && filename.ends_with(".bat") ||
               filename.starts_with("tauri_ps_") && filename.ends_with(".ps1") {

                // 检查文件修改时间
                if let Ok(metadata) = fs::metadata(&path) {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(age) = now.duration_since(modified) {
                            // 如果文件超过 1 小时，删除它
                            if age > cleanup_threshold {
                                if fs::remove_file(&path).is_ok() {
                                    cleaned_count += 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}
