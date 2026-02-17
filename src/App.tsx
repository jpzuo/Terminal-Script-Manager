import { useState, useEffect } from "react";
import { Command } from "./types/command";
import { commandStore } from "./store/commands";
import { Sidebar } from "./components/Sidebar";
import { CommandList } from "./components/CommandList";
import { CommandModal } from "./components/CommandModal";
import "./App.css";

function App() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", command: "", tags: "" });

  useEffect(() => {
    loadCommands();
  }, []);

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

  return (
    <div className="app-container">
      <Sidebar
        search={search}
        onSearchChange={setSearch}
        onAddClick={handleAdd}
        tags={allTags}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
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
    </div>
  );
}

export default App;
