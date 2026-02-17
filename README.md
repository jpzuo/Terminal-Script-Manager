# Terminal Script Manager

一个基于 Tauri + React + TypeScript 的跨平台终端命令管理器。

## 功能特性

- ✅ 存储常用终端命令
- ✅ 一键执行命令（自动打开终端）
- ✅ 标签管理和搜索
- ✅ 跨平台支持（Windows/macOS/Linux）
- ✅ 轻量级（内存占用约 10-20MB）

## 安装依赖

### 1. 安装 Rust

访问 [https://rustup.rs/](https://rustup.rs/) 下载并安装 Rust。

Windows 用户：
```bash
# 下载并运行 rustup-init.exe
# 或使用 winget
winget install Rustlang.Rustup
```

安装完成后，重启终端并验证：
```bash
rustc --version
cargo --version
```

### 2. 安装 Node.js 依赖

```bash
npm install
```

## 运行项目

```bash
npm run dev
```

## 构建应用

```bash
npm run build
```

构建完成后，可执行文件位于 `src-tauri/target/release/` 目录。

## 使用说明

1. 点击"添加命令"按钮创建新命令
2. 填写命令名称、命令内容和标签（可选）
3. 点击"运行"按钮，应用会自动打开终端并执行命令
4. 使用搜索框快速查找命令

## 技术栈

- **Tauri 2.x** - 轻量级桌面框架
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Rust** - 后端逻辑

## 项目结构

```
terminal-script-manager/
├── src/                    # React 前端代码
│   ├── App.tsx            # 主组件
│   ├── store/             # 数据存储
│   └── types.ts           # 类型定义
├── src-tauri/             # Tauri 后端代码
│   ├── src/
│   │   └── lib.rs         # Rust 主逻辑
│   └── Cargo.toml         # Rust 依赖
└── package.json
```

## 数据存储

命令数据存储在本地 JSON 文件中，路径：
- Windows: `%APPDATA%\com.terminal-script-manager.app\commands.json`
- macOS: `~/Library/Application Support/com.terminal-script-manager.app/commands.json`
- Linux: `~/.config/com.terminal-script-manager.app/commands.json`
