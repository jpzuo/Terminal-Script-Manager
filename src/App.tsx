/*
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-17 00:00:00
 * @LastEditors: ZJP
 * @LastEditTime: 2026-02-17 00:00:00
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src\App.tsx
 * @Description: 应用主组件，负责命令管理和主题切换
 */

import { useState, useEffect, useMemo, useDeferredValue, useRef } from "react";
import { Command } from "./types/command";
import { commandStore } from "./store/commands";
import { groupStore } from "./store/groups";
import { themeStore, Theme } from "./store/theme";
import { terminalStore } from "./store/terminal";
import { syncStore } from "./store/sync";
import { TerminalType } from "./types/terminal";
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
import { confirm as tauriConfirm, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  createGistForSync,
  pushToGist,
  pullFromGist,
  checkAutoUpload,
  uploadSnapshot,
} from "./utils/sync";
import "./App.css";

function App() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTerminalType, setSelectedTerminalType] = useState<TerminalType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    command: "",
    tags: "",
    terminalType: 'cmd' as TerminalType
  });
  const [theme, setTheme] = useState<Theme>('dark');
  const [terminalType, setTerminalType] = useState<TerminalType>('cmd');
  const [syncToken, setSyncToken] = useState('');
  const [syncGistId, setSyncGistId] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const isClosingRef = useRef(false);

  useEffect(() => {
    loadCommands();
    loadTheme();
    loadTerminalType();
    loadSyncConfig();
  }, []);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | null = null;

    appWindow.onCloseRequested(async (event) => {
      if (isClosingRef.current) {
        return;
      }

      try {
        const check = await checkAutoUpload();
        if (check.status === 'ready' && check.snapshot && check.token && check.gistId) {
          const shouldWait = await tauriConfirm('检测到本地变更，是否等待上传完成后再退出？', {
            title: '同步提示',
            kind: 'warning',
          });
          if (shouldWait) {
            try {
              event.preventDefault();
              await uploadSnapshot(check.token, check.gistId, check.snapshot);
            } catch (error) {
              alert(`自动上传失败: ${error}`);
            }

            isClosingRef.current = true;
            await appWindow.close();
            return;
          } else {
            uploadSnapshot(check.token, check.gistId, check.snapshot).catch((error) => {
              console.error('关闭时自动上传失败:', error);
            });
          }
        }
      } catch (error) {
        console.error('关闭时同步检查失败:', error);
      }
    }).then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
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
      await appWindow.setTheme(theme === 'light' ? 'light' : 'dark');
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

  /**
   * 加载终端类型设置
   */
  const loadTerminalType = async () => {
    try {
      const savedType = await terminalStore.getTerminalType();
      setTerminalType(savedType);
    } catch (error) {
      console.error('加载终端类型失败:', error);
    }
  };

  const loadSyncConfig = async () => {
    try {
      const [token, gistId] = await Promise.all([
        syncStore.getToken(),
        syncStore.getGistId(),
      ]);
      setSyncToken(token);
      setSyncGistId(gistId);
    } catch (error) {
      console.error('加载同步配置失败:', error);
    }
  };

  /**
   * 切换终端类型
   * @param {TerminalType} newType - 新终端类型
   */
  const handleTerminalTypeChange = async (newType: TerminalType) => {
    try {
      await terminalStore.setTerminalType(newType);
      setTerminalType(newType);
    } catch (error) {
      alert(`切换终端类型失败: ${error}`);
    }
  };

  const handleSyncTokenChange = async (value: string) => {
    setSyncToken(value);
    try {
      await syncStore.setToken(value.trim());
    } catch (error) {
      alert(`保存 Token 失败: ${error}`);
    }
  };

  const handleSyncGistIdChange = async (value: string) => {
    setSyncGistId(value);
    try {
      await syncStore.setGistId(value.trim());
    } catch (error) {
      alert(`保存 Gist ID 失败: ${error}`);
    }
  };

  const ensureSyncToken = (): string | null => {
    const token = syncToken.trim();
    if (!token) {
      alert('请先填写 GitHub Token');
      return null;
    }
    return token;
  };

  const ensureGistId = (): string | null => {
    const gistId = syncGistId.trim();
    if (!gistId) {
      alert('请先填写 Gist ID');
      return null;
    }
    return gistId;
  };

  const handleCreateGist = async () => {
    const token = ensureSyncToken();
    if (!token) {
      return;
    }

    setSyncBusy(true);
    setSyncStatus('');
    try {
      const result = await createGistForSync(token);
      await syncStore.setGistId(result.gistId);
      setSyncGistId(result.gistId);
      setSyncStatus('Gist 创建成功');
    } catch (error) {
      alert(`创建 Gist 失败: ${error}`);
    } finally {
      setSyncBusy(false);
    }
  };

  const handleSyncPush = async () => {
    const token = ensureSyncToken();
    const gistId = ensureGistId();
    if (!token || !gistId) {
      return;
    }

    setSyncBusy(true);
    setSyncStatus('');
    try {
      await pushToGist(token, gistId);
      setSyncStatus('上传成功');
    } catch (error) {
      alert(`上传失败: ${error}`);
    } finally {
      setSyncBusy(false);
    }
  };

  const handleSyncPull = async () => {
    const token = ensureSyncToken();
    const gistId = ensureGistId();
    if (!token || !gistId) {
      return;
    }

    setSyncBusy(true);
    setSyncStatus('');
    try {
      const result = await pullFromGist(token, gistId);
      await loadCommands();
      setSyncStatus(`拉取成功：命令 ${result.commands} 个，分组 ${result.groups} 个`);
    } catch (error) {
      alert(`拉取失败: ${error}`);
    } finally {
      setSyncBusy(false);
    }
  };

  const loadCommands = async () => {
    const data = await commandStore.getAll();
    setCommands(data);
  };

  // 获取所有唯一标签
  const allTags = useMemo(() => {
    return Array.from(new Set(commands.flatMap((cmd) => cmd.tags))).sort();
  }, [commands]);

  // 筛选命令：先按终端类型筛选，再按标签筛选，最后按搜索词筛选
  const filteredCommands = useMemo(() => {
    const searchLower = deferredSearch.trim().toLowerCase();

    return commands.filter((cmd) => {
      // 终端类型筛选
      if (selectedTerminalType !== 'all') {
        // 获取命令的实际终端类型（命令自定义 > 全局默认）
        const actualTerminalType = cmd.terminalType || terminalType;
        if (actualTerminalType !== selectedTerminalType) {
          return false;
        }
      }

      // 标签筛选
      if (selectedTag && !cmd.tags.includes(selectedTag)) {
        return false;
      }

      // 搜索筛选
      if (searchLower) {
        return (
          cmd.name.toLowerCase().includes(searchLower) ||
          cmd.command.toLowerCase().includes(searchLower) ||
          cmd.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [commands, deferredSearch, selectedTag, selectedTerminalType, terminalType]);

  const shouldVirtualize = filteredCommands.length >= 300;

  const handleAdd = () => {
    setFormData({
      name: "",
      command: "",
      tags: "",
      terminalType: terminalType
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (cmd: Command) => {
    setFormData({
      name: cmd.name,
      command: cmd.command,
      tags: cmd.tags.join(", "),
      terminalType: cmd.terminalType || terminalType
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
        await commandStore.update(editingId, {
          name: formData.name,
          command: formData.command,
          tags,
          terminalType: formData.terminalType
        });
      } else {
        await commandStore.add({
          name: formData.name,
          command: formData.command,
          tags,
          groupId: null,
          terminalType: formData.terminalType
        });
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
      const cmdTerminalType = cmd.terminalType || terminalType;
      const result = await commandStore.execute(cmd.command, cmdTerminalType);
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
        groupId: cmd.groupId ?? null,
        terminalType: cmd.terminalType
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

      // 导入分组与命令（批量写入）
      await groupStore.bulkAdd(groups);
      await commandStore.bulkAdd(commands);

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
        selectedTerminalType={selectedTerminalType}
        onTerminalTypeSelect={setSelectedTerminalType}
      />

      <main className={`main-content${shouldVirtualize ? ' virtualized' : ''}`}>
        <CommandList
          commands={filteredCommands}
          onRun={handleRun}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopy={handleCopy}
          defaultTerminalType={terminalType}
          virtualized={shouldVirtualize}
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
          terminalType={terminalType}
          onTerminalTypeChange={handleTerminalTypeChange}
          syncToken={syncToken}
          syncGistId={syncGistId}
          syncStatus={syncStatus}
          syncBusy={syncBusy}
          onSyncTokenChange={handleSyncTokenChange}
          onSyncGistIdChange={handleSyncGistIdChange}
          onSyncCreateGist={handleCreateGist}
          onSyncPush={handleSyncPush}
          onSyncPull={handleSyncPull}
        />
      )}
    </div>
  );
}

export default App;
