import React from 'react';
import { Search, Plus, Tag, Settings, Terminal } from 'lucide-react';
import { TerminalType } from '../types/terminal';

interface SidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  tags: string[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onSettingsClick: () => void;
  selectedTerminalType: TerminalType | 'all';
  onTerminalTypeSelect: (type: TerminalType | 'all') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  search,
  onSearchChange,
  onAddClick,
  tags,
  selectedTag,
  onTagSelect,
  onSettingsClick,
  selectedTerminalType,
  onTerminalTypeSelect,
}) => {
  return (
    <div className="sidebar">
      {/* 上区域：搜索和添加 */}
      <div className="sidebar-top">
        <div className="search-add-row">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="搜索命令..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <button
            className="icon-btn add-btn"
            onClick={onAddClick}
            title="添加命令"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* 中区域：终端类型筛选 */}
      <div className="sidebar-middle">
        <div className="terminal-filter-header">
          <Terminal size={16} />
          <span>终端类型</span>
        </div>

        <div className="terminal-filter-list">
          <button
            className={`terminal-filter-item ${selectedTerminalType === 'all' ? 'active' : ''}`}
            onClick={() => onTerminalTypeSelect('all')}
            title="显示全部"
          >
            全部
          </button>

          <button
            className={`terminal-filter-item ${selectedTerminalType === 'cmd' ? 'active' : ''}`}
            onClick={() => onTerminalTypeSelect('cmd')}
            title="只显示 CMD 命令"
          >
            <span className="terminal-badge-inline cmd">CMD</span>
          </button>

          <button
            className={`terminal-filter-item ${selectedTerminalType === 'powershell' ? 'active' : ''}`}
            onClick={() => onTerminalTypeSelect('powershell')}
            title="只显示 PowerShell 命令"
          >
            <span className="terminal-badge-inline ps">PS</span>
          </button>
        </div>
      </div>

      {/* 下区域：标签筛选 */}
      <div className="sidebar-bottom">
        <div className="tags-header">
          <Tag size={16} />
          <span>标签筛选</span>
        </div>

        <div className="tags-list">
          <button
            className={`tag-item ${selectedTag === null ? 'active' : ''}`}
            onClick={() => onTagSelect(null)}
            title="显示全部"
          >
            全部
          </button>

          {tags.map((tag) => (
            <button
              key={tag}
              className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => onTagSelect(tag)}
              title={`筛选: ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 设置按钮 */}
        <button
          className="settings-btn"
          onClick={onSettingsClick}
          title="设置"
        >
          <Settings size={18} />
          <span>设置</span>
        </button>
      </div>
    </div>
  );
};
