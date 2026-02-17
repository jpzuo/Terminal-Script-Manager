@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 终端脚本管理器 - 自动发布脚本 (Windows)
:: 使用方法: release.bat [patch|minor|major]

echo.
echo ==========================================
echo 终端脚本管理器 - 自动发布脚本
echo ==========================================
echo.

:: 检查是否有未提交的更改
echo [INFO] 检查 Git 状态...
git status -s >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 不是 Git 仓库
    pause
    exit /b 1
)

for /f %%i in ('git status -s') do (
    echo [ERROR] 存在未提交的更改，请先提交或暂存
    git status -s
    pause
    exit /b 1
)
echo [INFO] Git 状态检查通过

:: 检查分支
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
echo [INFO] 当前分支: %current_branch%

if not "%current_branch%"=="master" if not "%current_branch%"=="main" (
    echo [WARN] 不在主分支
    set /p confirm="是否继续? (y/N): "
    if /i not "!confirm!"=="y" (
        echo [INFO] 已取消发布
        pause
        exit /b 0
    )
)

:: 拉取最新代码
echo [INFO] 拉取最新代码...
git pull origin %current_branch%
if errorlevel 1 (
    echo [ERROR] 拉取代码失败
    pause
    exit /b 1
)

:: 显示当前版本
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set current_version=%%i
echo [INFO] 当前版本: %current_version%

:: 选择版本类型
if not "%~1"=="" (
    set version_type=%~1
) else (
    echo.
    echo 请选择版本类型:
    echo   1^) patch  - 补丁版本 ^(0.1.0 -^> 0.1.1^) - 修复 bug
    echo   2^) minor  - 次要版本 ^(0.1.0 -^> 0.2.0^) - 新功能
    echo   3^) major  - 主要版本 ^(0.1.0 -^> 1.0.0^) - 重大更新
    echo.
    set /p choice="请输入选项 (1/2/3): "

    if "!choice!"=="1" set version_type=patch
    if "!choice!"=="2" set version_type=minor
    if "!choice!"=="3" set version_type=major

    if not defined version_type (
        echo [ERROR] 无效的选项
        pause
        exit /b 1
    )
)

echo [INFO] 选择的版本类型: %version_type%

:: 确认发布
echo.
set /p confirm="确认发布新版本? (y/N): "
if /i not "!confirm!"=="y" (
    echo [INFO] 已取消发布
    pause
    exit /b 0
)

:: 更新版本号
echo [INFO] 更新版本号...
call npm version %version_type% -m "chore: release %%s"
if errorlevel 1 (
    echo [ERROR] 更新版本号失败
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set new_version=%%i
echo [INFO] 新版本: %new_version%

:: 推送代码
echo [INFO] 推送代码到远程仓库...
git push
if errorlevel 1 (
    echo [ERROR] 推送代码失败
    pause
    exit /b 1
)

:: 推送标签
echo [INFO] 推送标签到远程仓库...
git push --tags
if errorlevel 1 (
    echo [ERROR] 推送标签失败
    pause
    exit /b 1
)

echo [INFO] ✓ 推送完成

:: 显示发布信息
echo.
echo ==========================================
echo 发布成功！
echo ==========================================
echo 版本: v%new_version%
echo 类型: %version_type%
echo.
echo GitHub Actions 正在自动构建...
echo 查看构建进度: https://github.com/jpzuo/Terminal-Script-Manager/actions
echo 查看发布页面: https://github.com/jpzuo/Terminal-Script-Manager/releases
echo ==========================================
echo.

pause
