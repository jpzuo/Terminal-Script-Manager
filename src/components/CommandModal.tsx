import React from 'react';
import { X, Save } from 'lucide-react';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: {
    name: string;
    command: string;
    tags: string;
  };
  onFormChange: (field: string, value: string) => void;
  isEditing: boolean;
}

export const CommandModal: React.FC<CommandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formData,
  onFormChange,
  isEditing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? '编辑命令' : '添加命令'}</h2>
          <button className="icon-btn" onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>命令名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="例如：启动开发服务器"
            />
          </div>

          <div className="form-group">
            <label>命令内容</label>
            <textarea
              value={formData.command}
              onChange={(e) => onFormChange('command', e.target.value)}
              placeholder="例如：npm run dev"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>标签（用逗号分隔）</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => onFormChange('tags', e.target.value)}
              placeholder="例如：开发,npm,前端"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            <Save size={18} />
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  );
};
