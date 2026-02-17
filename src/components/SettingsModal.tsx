import React, { useRef } from 'react';
import { X, Download, Upload } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      // 重置 input，允许重复选择同一文件
      e.target.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>设置</h2>
          <button className="icon-btn" onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3 className="settings-section-title">数据管理</h3>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">导出配置</div>
                <div className="settings-item-desc">
                  将所有命令和分组导出为 JSON 文件
                </div>
              </div>
              <button className="btn btn-secondary" onClick={onExport}>
                <Download size={18} />
                <span>导出</span>
              </button>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">导入配置</div>
                <div className="settings-item-desc">
                  从 JSON 文件导入命令和分组
                </div>
              </div>
              <button className="btn btn-secondary" onClick={handleImportClick}>
                <Upload size={18} />
                <span>导入</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
