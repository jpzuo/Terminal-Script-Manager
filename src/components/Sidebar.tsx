import React from 'react';
import { Search, Plus, Tag } from 'lucide-react';

interface SidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  tags: string[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  search,
  onSearchChange,
  onAddClick,
  tags,
  selectedTag,
  onTagSelect,
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
      </div>
    </div>
  );
};
