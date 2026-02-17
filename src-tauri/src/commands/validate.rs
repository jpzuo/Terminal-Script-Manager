use regex::Regex;

pub struct CommandValidator {
    dangerous_patterns: Vec<Regex>,
}

impl CommandValidator {
    pub fn new() -> Self {
        Self {
            dangerous_patterns: vec![
                Regex::new(r"[;&|`$(){}[\]<>]").unwrap(),
                Regex::new(r"rm\s+-rf").unwrap(),
                Regex::new(r"sudo").unwrap(),
                Regex::new(r"eval").unwrap(),
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

    pub fn sanitize(&self, command: &str) -> String {
        command
            .replace("\"", "\\\"")
            .replace("'", "\\'")
            .replace("\n", " ")
            .replace("\r", "")
    }
}
