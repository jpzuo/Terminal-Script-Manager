#!/bin/bash

# 终端脚本管理器 - 自动发布脚本
# 使用方法: ./release.sh [patch|minor|major]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否有未提交的更改
check_git_status() {
    if [[ -n $(git status -s) ]]; then
        print_error "存在未提交的更改，请先提交或暂存"
        git status -s
        exit 1
    fi
    print_info "Git 状态检查通过"
}

# 检查是否在主分支
check_branch() {
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "master" && "$current_branch" != "main" ]]; then
        print_warn "当前分支: $current_branch"
        read -p "不在主分支，是否继续? (y/N): " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            print_info "已取消发布"
            exit 0
        fi
    fi
}

# 拉取最新代码
pull_latest() {
    print_info "拉取最新代码..."
    git pull origin $(git branch --show-current)
}

# 显示当前版本
show_current_version() {
    current_version=$(node -p "require('./package.json').version")
    print_info "当前版本: $current_version"
}

# 选择版本类型
select_version_type() {
    if [[ -n "$1" ]]; then
        version_type="$1"
    else
        echo ""
        echo "请选择版本类型:"
        echo "  1) patch  - 补丁版本 (0.1.0 -> 0.1.1) - 修复 bug"
        echo "  2) minor  - 次要版本 (0.1.0 -> 0.2.0) - 新功能"
        echo "  3) major  - 主要版本 (0.1.0 -> 1.0.0) - 重大更新"
        echo ""
        read -p "请输入选项 (1/2/3): " choice

        case $choice in
            1) version_type="patch" ;;
            2) version_type="minor" ;;
            3) version_type="major" ;;
            *)
                print_error "无效的选项"
                exit 1
                ;;
        esac
    fi

    print_info "选择的版本类型: $version_type"
}

# 输入更新说明
input_release_notes() {
    echo ""
    print_info "请输入本次更新的主要内容 (按 Ctrl+D 结束输入):"
    release_notes=$(cat)

    if [[ -z "$release_notes" ]]; then
        print_warn "未输入更新说明，将使用默认提交信息"
        release_notes="版本更新"
    fi
}

# 更新版本号
update_version() {
    print_info "更新版本号..."
    npm version $version_type -m "chore: release %s"
    new_version=$(node -p "require('./package.json').version")
    print_info "新版本: $new_version"
}

# 推送代码和标签
push_to_remote() {
    print_info "推送代码到远程仓库..."
    git push

    print_info "推送标签到远程仓库..."
    git push --tags

    print_info "✓ 推送完成"
}

# 显示发布信息
show_release_info() {
    echo ""
    print_info "=========================================="
    print_info "发布成功！"
    print_info "=========================================="
    print_info "版本: v$new_version"
    print_info "类型: $version_type"
    print_info ""
    print_info "GitHub Actions 正在自动构建..."
    print_info "查看构建进度: https://github.com/jpzuo/Terminal-Script-Manager/actions"
    print_info "查看发布页面: https://github.com/jpzuo/Terminal-Script-Manager/releases"
    print_info "=========================================="
}

# 主流程
main() {
    echo ""
    print_info "=========================================="
    print_info "终端脚本管理器 - 自动发布脚本"
    print_info "=========================================="
    echo ""

    # 1. 检查 Git 状态
    check_git_status

    # 2. 检查分支
    check_branch

    # 3. 拉取最新代码
    pull_latest

    # 4. 显示当前版本
    show_current_version

    # 5. 选择版本类型
    select_version_type "$1"

    # 6. 输入更新说明
    # input_release_notes

    # 7. 确认发布
    echo ""
    read -p "确认发布新版本? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        print_info "已取消发布"
        exit 0
    fi

    # 8. 更新版本号
    update_version

    # 9. 推送到远程
    push_to_remote

    # 10. 显示发布信息
    show_release_info
}

# 运行主流程
main "$@"
