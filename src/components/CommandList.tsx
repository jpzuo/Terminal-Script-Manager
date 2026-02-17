import React from 'react';
import { Play, Edit, Trash2, Copy } from 'lucide-react';
import { Command } from '../types/command';

interface CommandListProps {
  commands: Command[];
  onRun: (command: Command) => void;
  onEdit: (command: Command) => void;
  onDelete: (id: string) => void;
  onCopy: (command: Command) => void;
}

export const CommandList: React.FC<CommandListProps> = ({
  commands,
  onRun,
  onEdit,
  onDelete,
  onCopy,
}) => {
  if (commands.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无命令</p>
        <p className="empty-hint">点击左侧 + 按钮添加新命令</p>
      </div>
    );
  }

  return (
    <div className="command-list">
      {commands.map((cmd) => (
        <div key={cmd.id} className="command-card">
          <div className="command-header">
            <h3 className="command-name">{cmd.name}</h3>
            <div className="command-actions">
              <button
                className="icon-btn"
                onClick={() => onRun(cmd)}
                title="运行命令"
              >
                <Play size={18} />
              </button>
              <button
                className="icon-btn"
                onClick={() => onEdit(cmd)}
                title="编辑命令"
              >
                <Edit size={18} />
              </button>
              <button
                className="icon-btn"
                onClick={() => onCopy(cmd)}
                title="复制命令"
              >
                <Copy size={18} />
              </button>
              <button
                className="icon-btn delete-btn"
                onClick={() => onDelete(cmd.id)}
                title="删除命令"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="command-content">
            <code>{cmd.command}</code>
          </div>

          {cmd.tags && cmd.tags.length > 0 && (
            <div className="command-tags">
              {cmd.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
