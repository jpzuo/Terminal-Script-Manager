/*
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-17 00:00:00
 * @LastEditors: ZJP
 * @LastEditTime: 2026-02-17 00:00:00
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src\App.tsx
 * @Description: 应用主组件，负责命令管理和主题切换
 */

import { useState, useEffect } from "react";
import { Command } from "./types/command";
import { commandStore } from "./store/commands";
import { groupStore } from "./store/groups";
import { themeStore, Theme } from "./store/theme";
import { Sidebar } from "./components/Sidebar";
import { CommandList } from "./components/CommandList";
import { CommandModal } from "./components/CommandModal";
import { SettingsModal } from "./components/SettingsModal";
import {
  exportToJSON,
  validateImportData,
  processImportData,
  readJSONFile,
} from "./utils/importExport";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

function App() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", command: "", tags: "" });
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    loadCommands();
    loadTheme();
  }, []);

  /**
   * 加载主题设置
   */
  const loadTheme = async () => {
    try {
      const savedTheme = await themeStore.getTheme();
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } catch (error) {
      console.error('加载主题失败:', error);
    }
  };

  /**
   * 应用主题到 DOM 和窗口
   * @param {Theme} theme - 要应用的主题
   */
  const applyTheme = async (theme: Theme) => {
    // 应用到 HTML 元素
    document.documentElement.setAttribute('data-theme', theme);

    // 应用到 Tauri 窗口标题栏
    try {
      const appWindow = getCurrentWindow();
      // Tauri v2 的 setTheme 接受 'light' | 'dark' | null
      const themeValue = theme === 'light' ? 'light' : 'dark';
      console.log('正在设置窗口主题:', themeValue);
      await appWindow.setTheme(themeValue);
      console.log('窗口主题设置成功');
    } catch (error) {
      console.error('设置窗口主题失败:', error);
    }
  };

  /**
   * 切换主题
   * @param {Theme} newTheme - 新主题
   */
  const handleThemeChange = async (newTheme: Theme) => {
    try {
      await themeStore.setTheme(newTheme);
      setTheme(newTheme);
      applyTheme(newTheme);
    } catch (error) {
      alert(`切换主题失败: ${error}`);
    }
  };

  const loadCommands = async () => {
    const data = await commandStore.getAll();
    setCommands(data);
  };

  // 获取所有唯一标签
  const allTags = Array.from(
    new Set(commands.flatMap((cmd) => cmd.tags))
  ).sort();

  // 筛选命令：先按标签筛选，再按搜索词筛选
  const filteredCommands = commands.filter((cmd) => {
    // 标签筛选
    if (selectedTag && !cmd.tags.includes(selectedTag)) {
      return false;
    }

    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        cmd.name.toLowerCase().includes(searchLower) ||
        cmd.command.toLowerCase().includes(searchLower) ||
        cmd.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  const handleAdd = () => {
    setFormData({ name: "", command: "", tags: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (cmd: Command) => {
    setFormData({
      name: cmd.name,
      command: cmd.command,
      tags: cmd.tags.join(", "),
    });
    setEditingId(cmd.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.command.trim()) {
      alert("命令名称和命令内容不能为空");
      return;
    }

    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingId) {
        await commandStore.update(editingId, { ...formData, tags });
      } else {
        await commandStore.add({ ...formData, tags });
      }
      setShowModal(false);
      loadCommands();
    } catch (error) {
      alert(`保存失败: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这个命令吗？")) {
      try {
        await commandStore.delete(id);
        loadCommands();
      } catch (error) {
        alert(`删除失败: ${error}`);
      }
    }
  };

  const handleRun = async (cmd: Command) => {
    try {
      const result = await commandStore.execute(cmd.command);
      if (!result.success) {
        alert(`执行失败: ${result.message}`);
      }
    } catch (error) {
      alert(`执行失败: ${error}`);
    }
  };

  // 复制命令功能
  const handleCopy = async (cmd: Command) => {
    try {
      const newCommand = {
        name: `${cmd.name} (副本)`,
        command: cmd.command,
        tags: cmd.tags,
      };
      await commandStore.add(newCommand);
      loadCommands();
    } catch (error) {
      alert(`复制失败: ${error}`);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 导出功能
  const handleExport = async () => {
    try {
      const commands = await commandStore.getAll();
      const groups = await groupStore.getAll();

      const exportData = exportToJSON(commands, groups);
      const defaultFilename = `commands-export-${Date.now()}.json`;

      // 使用 Tauri 的保存对话框让用户选择保存位置
      const filePath = await save({
        defaultPath: defaultFilename,
        filters: [
          {
            name: 'JSON',
            extensions: ['json']
          }
        ]
      });

      // 用户取消了保存
      if (!filePath) {
        return;
      }

      // 写入文件
      const jsonString = JSON.stringify(exportData, null, 2);
      await writeTextFile(filePath, jsonString);

      alert('导出成功！');
    } catch (error) {
      alert(`导出失败: ${error}`);
    }
  };

  // 导入功能
  const handleImport = async (file: File) => {
    try {
      // 读取文件
      const data = await readJSONFile(file);

      // 验证数据格式
      const validation = validateImportData(data);
      if (!validation.valid) {
        alert(`导入失败:\n${validation.errors.join('\n')}`);
        return;
      }

      // 获取现有数据
      const existingCommands = await commandStore.getAll();
      const existingGroups = await groupStore.getAll();

      // 处理导入数据（重新生成 ID）
      const { commands, groups } = processImportData(
        data,
        existingCommands,
        existingGroups
      );

      // 导入分组
      for (const group of groups) {
        await groupStore.add(group);
      }

      // 导入命令
      for (const command of commands) {
        await commandStore.add(command);
      }

      // 刷新界面
      loadCommands();

      alert(`导入成功！\n命令: ${commands.length} 个\n分组: ${groups.length} 个`);
      setShowSettings(false);
    } catch (error) {
      alert(`导入失败: ${error}`);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        search={search}
        onSearchChange={setSearch}
        onAddClick={handleAdd}
        tags={allTags}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className="main-content">
        <CommandList
          commands={filteredCommands}
          onRun={handleRun}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopy={handleCopy}
        />
      </main>

      <CommandModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        formData={formData}
        onFormChange={handleFormChange}
        isEditing={!!editingId}
      />

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onExport={handleExport}
          onImport={handleImport}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
      )}
    </div>
  );
}

export default App;
