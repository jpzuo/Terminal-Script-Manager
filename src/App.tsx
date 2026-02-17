import { useState, useEffect } from "react";
import { Command } from "./types/command";
import { commandStore } from "./store/commands";
import "./App.css";

function App() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [search, setSearch] = useState("");
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

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    setFormData({ name: "", command: "", tags: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (cmd: Command) => {
    setFormData({ name: cmd.name, command: cmd.command, tags: cmd.tags.join(", ") });
    setEditingId(cmd.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    const tags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (editingId) {
      await commandStore.update(editingId, { ...formData, tags });
    } else {
      await commandStore.add({ ...formData, tags });
    }
    setShowModal(false);
    loadCommands();
  };

  const handleDelete = async (id: string) => {
    await commandStore.delete(id);
    loadCommands();
  };

  const handleRun = async (cmd: string) => {
    await commandStore.execute(cmd);
  };

  return (
    <div className="app">
      <div className="header">
        <input
          className="search-input"
          placeholder="搜索命令或标签..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={handleAdd}>
          添加命令
        </button>
      </div>

      <div className="commands-grid">
        {filteredCommands.map((cmd) => (
          <div key={cmd.id} className="command-card">
            <div className="command-name">{cmd.name}</div>
            <div className="command-text">{cmd.command}</div>
            {cmd.tags.length > 0 && (
              <div className="command-tags">
                {cmd.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="command-actions">
              <button className="btn btn-run" onClick={() => handleRun(cmd.command)}>
                运行
              </button>
              <button className="btn btn-edit" onClick={() => handleEdit(cmd)}>
                编辑
              </button>
              <button className="btn btn-delete" onClick={() => handleDelete(cmd.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{editingId ? "编辑命令" : "添加命令"}</div>
            <div className="form-group">
              <label className="form-label">命令名称</label>
              <input
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">命令内容</label>
              <textarea
                className="form-textarea"
                value={formData.command}
                onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">标签（逗号分隔）</label>
              <input
                className="form-input"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button className="btn add-btn" onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
