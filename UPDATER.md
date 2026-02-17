# 自动更新配置说明

## 已完成的配置

1. ✅ 安装了 `@tauri-apps/plugin-updater` 插件
2. ✅ 配置了 GitHub Actions 自动发布工作流
3. ✅ 在应用中添加了检查更新功能
4. ✅ 配置了 Tauri 更新器

## 使用流程

### 1. 发布新版本

```bash
# 更新版本号（会自动更新 package.json 和 tauri.conf.json）
npm version patch  # 0.1.0 -> 0.1.1
# 或
npm version minor  # 0.1.0 -> 0.2.0
# 或
npm version major  # 0.1.0 -> 1.0.0

# 推送代码和标签到 GitHub
git push && git push --tags
```

### 2. 自动构建和发布

推送标签后，GitHub Actions 会自动：
- 构建 Windows 安装包
- 创建 GitHub Release
- 上传安装包和更新清单文件

### 3. 用户更新

用户可以通过以下方式更新：
- 打开应用设置 → 点击"检查更新"按钮
- 应用会自动检查 GitHub Releases
- 如有新版本，提示用户下载并安装

## 重要配置

### 修改 GitHub 仓库地址

在 [tauri.conf.json](src-tauri/tauri.conf.json:46) 中，将 `YOUR_USERNAME/YOUR_REPO` 替换为你的实际仓库地址：

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
  ]
}
```

例如：
```json
"endpoints": [
  "https://github.com/zjp/terminal-script-manager/releases/latest/download/latest.json"
]
```

## 注意事项

1. 首次发布需要手动创建 v0.1.0 标签并推送
2. 确保 GitHub 仓库是公开的，或配置了正确的访问权限
3. 更新清单文件 (latest.json) 会由 Tauri 自动生成
4. Windows 安装包会使用 NSIS 格式，支持静默更新

## 扩展支持

如需支持 macOS 和 Linux，修改 [.github/workflows/release.yml](.github/workflows/release.yml:11)：

```yaml
matrix:
  platform: [windows-latest, macos-latest, ubuntu-20.04]
```
