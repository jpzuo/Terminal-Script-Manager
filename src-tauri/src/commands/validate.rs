use once_cell::sync::Lazy;
use regex::Regex;

// 全局单例，只编译一次
static VALIDATOR: Lazy<CommandValidator> = Lazy::new(|| CommandValidator::new());

pub struct CommandValidator {
    dangerous_patterns: Vec<Regex>,
}

impl CommandValidator {
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
pub fn get_validator() -> &'static CommandValidator {
    &VALIDATOR
}
