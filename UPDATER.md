# 自动更新配置说明

## 已完成的配置

1. ✅ 安装了 `@tauri-apps/plugin-updater` 插件
2. ✅ 配置了 GitHub Actions 自动发布工作流
3. ✅ 在应用中添加了检查更新功能
4. ✅ 配置了 Tauri 更新器
5. ✅ 创建了自动发布脚本

## 快速发布

### Windows 用户

双击运行 `release.bat`，或在命令行中：

```cmd
# 交互式选择版本类型
release.bat

# 直接指定版本类型
release.bat patch   # 补丁版本 (0.1.0 -> 0.1.1)
release.bat minor   # 次要版本 (0.1.0 -> 0.2.0)
release.bat major   # 主要版本 (0.1.0 -> 1.0.0)
```

### Linux/Mac 用户

```bash
# 添加执行权限（首次）
chmod +x release.sh

# 交互式选择版本类型
./release.sh

# 直接指定版本类型
./release.sh patch   # 补丁版本
./release.sh minor   # 次要版本
./release.sh major   # 主要版本
```

## 版本类型说明

- **patch** (补丁版本): 修复 bug，向后兼容
- **minor** (次要版本): 新增功能，向后兼容
- **major** (主要版本): 重大更新，可能不兼容旧版本

## 首次配置

### 1. 配置 GitHub Secret

进入 GitHub 仓库设置：https://github.com/jpzuo/Terminal-Script-Manager/settings/secrets/actions

添加 Secret：
- Name: `TAURI_SIGNING_PRIVATE_KEY`
- Value: (私钥内容，见下方)

```
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5N3dRNktvdVZ4Y1Z2MFZncDh4ak8rWWtFZ0NYNHFHNG1jWFJBZUJZNlpsMEFBQkFBQUFBQUFBQUFBQUlBQUFBQXRaMXZpMElDUjZOK2N0MlBkZStpcytmbHNGeDV6ek1YSE1nZ1BsajFwZStVdUxMQW1zU3V1MEJDNUVRelVpY09BYkVyeTdDeXFQY3FMOXRFVjdkUWhLQ2RoTkcrYXJ1R25yZzVUNmRnRnNyRmVycnZnMm1KU2NnSHpHUVRGYkMySXppTkE0TmhENEE9Cg==
```

### 2. 提交脚本到仓库

```bash
git add release.sh release.bat
git commit -m "chore: 添加自动发布脚本"
git push
```

## 发布流程

脚本会自动执行以下步骤：

1. ✓ 检查 Git 状态（确保没有未提交的更改）
2. ✓ 检查当前分支
3. ✓ 拉取最新代码
4. ✓ 显示当前版本
5. ✓ 选择版本类型
6. ✓ 确认发布
7. ✓ 更新版本号（自动修改 package.json 和 tauri.conf.json）
8. ✓ 推送代码和标签到 GitHub
9. ✓ 触发 GitHub Actions 自动构建

## 自动构建流程

推送标签后，GitHub Actions 会自动：

1. 构建 Windows 安装包（约 5-10 分钟）
2. 创建 GitHub Release
3. 上传安装包和更新清单文件
4. 生成包含所有 commit 的更新日志

## 查看发布结果

- 构建进度: https://github.com/jpzuo/Terminal-Script-Manager/actions
- 发布页面: https://github.com/jpzuo/Terminal-Script-Manager/releases

## 用户更新

用户可以通过以下方式更新：
- 打开应用设置 → 点击"检查更新"按钮
- 应用会自动检查 GitHub Releases
- 如有新版本，提示用户下载并安装

## 注意事项

1. 首次发布需要手动创建 v0.1.0 标签并推送
2. 确保 GitHub 仓库是公开的，或配置了正确的访问权限
3. 更新清单文件 (latest.json) 会由 Tauri 自动生成
4. Windows 安装包会使用 NSIS 格式，支持静默更新
5. 私钥必须保密，不要提交到 Git 仓库

## 扩展支持

如需支持 macOS 和 Linux，修改 [.github/workflows/release.yml](.github/workflows/release.yml:11)：

```yaml
matrix:
  platform: [windows-latest, macos-latest, ubuntu-20.04]
```
