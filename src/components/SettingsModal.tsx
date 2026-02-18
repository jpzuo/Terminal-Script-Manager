/*
 * @Author: ZJP 2712104231@qq.com
 * @Date: 2026-02-17 00:00:00
 * @LastEditors: ZJP
 * @LastEditTime: 2026-02-17 00:00:00
 * @FilePath: c:\Works\oneself\client-script\Terminal-script-manager\src\components\SettingsModal.tsx
 * @Description: 设置模态框组件，包含数据导入导出和主题切换功能
 */

import React, { useRef } from 'react';
import { X, Download, Upload, Moon, Sun, RefreshCw, Terminal } from 'lucide-react';
import { Theme } from '../store/theme';
import { TerminalType } from '../types/terminal';
import { checkForUpdates } from '../utils/updater';

interface SettingsModalProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  terminalType: TerminalType;
  onTerminalTypeChange: (type: TerminalType) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onExport,
  onImport,
  theme,
  onThemeChange,
  terminalType,
  onTerminalTypeChange,
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

  /**
   * 处理检查更新
   */
  const handleCheckUpdate = async () => {
    try {
      await checkForUpdates();
    } catch (error) {
      alert(`检查更新失败: ${error}`);
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
            <h3 className="settings-section-title">外观</h3>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">主题模式</div>
                <div className="settings-item-desc">
                  切换浅色或深色主题
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'light' ? '深色' : '浅色'}</span>
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">终端设置</h3>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">终端类型</div>
                <div className="settings-item-desc">
                  选择新建命令时的默认终端类型（每个命令可单独设置）
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn ${terminalType === 'cmd' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onTerminalTypeChange('cmd')}
                >
                  <Terminal size={18} />
                  <span>CMD</span>
                </button>
                <button
                  className={`btn ${terminalType === 'powershell' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onTerminalTypeChange('powershell')}
                >
                  <Terminal size={18} />
                  <span>PowerShell</span>
                </button>
              </div>
            </div>
          </div>

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

          <div className="settings-section">
            <h3 className="settings-section-title">关于</h3>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">检查更新</div>
                <div className="settings-item-desc">
                  检查是否有新版本可用
                </div>
              </div>
              <button className="btn btn-secondary" onClick={handleCheckUpdate}>
                <RefreshCw size={18} />
                <span>检查更新</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
