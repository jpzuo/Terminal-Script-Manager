/**
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-25 11:04:50
 * @LastEditors: 左金谱
 * @LastEditTime: 2026-02-25 11:04:50
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src-tauri\src\commands\validate.rs
 * @Description: 命令校验与预处理逻辑，提供安全校验与脚本适配能力
 */
use once_cell::sync::Lazy;
use regex::Regex;

// 全局单例，只编译一次
static VALIDATOR: Lazy<CommandValidator> = Lazy::new(|| CommandValidator::new());

pub struct CommandValidator {
    /// 危险模式列表，用于拦截高风险命令片段
    dangerous_patterns: Vec<Regex>,
}

impl CommandValidator {
    /**
     * 创建命令校验器
     * @returns {CommandValidator} 校验器实例
     * @example
     * // 创建校验器实例
     * let validator = CommandValidator::new();
     */
    fn new() -> Self {
        Self {
            dangerous_patterns: vec![
                // 只阻止真正危险的模式，允许常用的命令连接符
                Regex::new(r"`").unwrap(),           // 反引号（命令替换）
                Regex::new(r"\$\(").unwrap(),        // 命令替换 $()
                Regex::new(r"[<>]").unwrap(),        // 重定向符号
                Regex::new(r"rm\s+-rf").unwrap(),    // 危险的删除命令
                Regex::new(r"sudo").unwrap(),        // sudo 命令
                Regex::new(r"eval").unwrap(),        // eval 命令
            ],
        }
    }

    /**
     * 校验命令是否安全且合法
     * @param {&str} command - 原始命令
     * @returns {Result<(), String>} 校验结果
     * @example
     * // 校验命令
     * let result = validator.validate("echo hello");
     */
    pub fn validate(&self, command: &str) -> Result<(), String> {
        if command.trim().is_empty() {
            return Err("命令不能为空".to_string());
        }

        if command.len() > 1000 {
            return Err("命令过长".to_string());
        }

        for pattern in &self.dangerous_patterns {
            if pattern.is_match(command) {
                return Err(format!("命令包含不安全字符或模式"));
            }
        }

        Ok(())
    }

    /**
     * 清理命令并转义引号，适用于非 Windows 脚本执行
     * @param {&str} command - 原始命令
     * @returns {String} 清理后的命令
     * @example
     * // 转义引号并规范换行
     * let sanitized = validator.sanitize("echo \"hi\"\r\n");
     */
    // 优化 sanitize：使用堆分配减少栈压力
    pub fn sanitize(&self, command: &str) -> String {
        // 预分配足够的容量，避免多次重新分配
        let mut result = String::with_capacity(command.len() + 50);

        for ch in command.chars() {
            match ch {
                '"' => result.push_str("\\\""),
                '\'' => result.push_str("\\'"),
                '\n' => result.push('\n'),  // 保留换行符，用于多行命令
                '\r' => {},  // 忽略回车符，统一使用 \n
                _ => result.push(ch),
            }
        }

        result
    }

    /**
     * 为 Windows 脚本准备命令，仅规范化换行符并保留引号
     * @param {&str} command - 原始命令
     * @returns {String} 处理后的命令
     * @example
     * // 保留引号与换行
     * let sanitized = validator.sanitize_for_windows_script("echo \"hi\"\r\n");
     */
    pub fn sanitize_for_windows_script(&self, command: &str) -> String {
        // 重要：预分配容量以减少重新分配次数
        let mut result = String::with_capacity(command.len());

        for ch in command.chars() {
            match ch {
                '\r' => {}, // 忽略回车符，统一使用 \n
                _ => result.push(ch),
            }
        }

        result
    }

    /**
     * 校验清理后的命令长度
     * @param {&str} sanitized - 清理后的命令
     * @returns {Result<(), String>} 校验结果
     * @example
     * // 校验清理后的命令
     * let result = validator.validate_sanitized("echo hi");
     */
    // 验证 sanitize 后的长度
    pub fn validate_sanitized(&self, sanitized: &str) -> Result<(), String> {
        // 转义后不应超过 1500 字符（1000 * 1.5 倍安全系数）
        if sanitized.len() > 1500 {
            return Err("命令转义后过长".to_string());
        }
        Ok(())
    }
}

// 提供公共访问函数
/**
 * 获取全局命令校验器实例
 * @returns {&'static CommandValidator} 全局校验器引用
 * @example
 * // 获取全局校验器
 * let validator = get_validator();
 */
pub fn get_validator() -> &'static CommandValidator {
    &VALIDATOR
}

#[cfg(test)]
mod tests {
    use super::CommandValidator;

    /**
     * 校验空命令与超长命令的拒绝逻辑
     * @returns {()} 无返回值
     * @example
     * // 运行测试
     * assert!(true);
     */
    #[test]
    fn rejects_empty_and_overlong_commands() {
        let validator = CommandValidator::new();
        assert!(validator.validate("").is_err());
        assert!(validator.validate("   ").is_err());
        assert!(validator.validate(&"a".repeat(1001)).is_err());
    }

    /**
     * 校验危险命令模式的拒绝逻辑
     * @returns {()} 无返回值
     * @example
     * // 运行测试
     * assert!(true);
     */
    #[test]
    fn rejects_dangerous_patterns() {
        let validator = CommandValidator::new();
        assert!(validator.validate("echo `whoami`").is_err());
        assert!(validator.validate("echo $(whoami)").is_err());
        assert!(validator.validate("rm -rf /").is_err());
        assert!(validator.validate("sudo ls").is_err());
        assert!(validator.validate("eval \"echo hi\"").is_err());
        assert!(validator.validate("echo > out.txt").is_err());
    }

    /**
     * 校验 sanitize 会转义引号并规范换行符
     * @returns {()} 无返回值
     * @example
     * // 运行测试
     * assert!(true);
     */
    #[test]
    fn sanitize_escapes_quotes_and_normalizes_newlines() {
        let validator = CommandValidator::new();
        let input = "echo \"hello\"\r\necho 'world'";
        let sanitized = validator.sanitize(input);
        assert!(sanitized.contains("\\\"hello\\\""));
        assert!(sanitized.contains("\\'world\\'"));
        assert!(!sanitized.contains('\r'));
    }

    /**
     * 校验 Windows 脚本清理逻辑保留引号
     * @returns {()} 无返回值
     * @example
     * // 运行测试
     * assert!(true);
     */
    #[test]
    fn sanitize_for_windows_script_preserves_quotes() {
        let validator = CommandValidator::new();
        let input = "Remove-Item -Recurse -Force \"C:\\Works\\zhlx\\zhlx_mobile\\node_modules\"\r\n";
        let sanitized = validator.sanitize_for_windows_script(input);
        assert!(sanitized.contains("\"C:\\Works\\zhlx\\zhlx_mobile\\node_modules\""));
        assert!(!sanitized.contains("\\\""));
        assert!(!sanitized.contains('\r'));
    }

    /**
     * 校验清理后命令长度限制
     * @returns {()} 无返回值
     * @example
     * // 运行测试
     * assert!(true);
     */
    #[test]
    fn validate_sanitized_length_limits() {
        let validator = CommandValidator::new();
        let long_command = "a".repeat(1501);
        assert!(validator.validate_sanitized(&long_command).is_err());
    }
}
