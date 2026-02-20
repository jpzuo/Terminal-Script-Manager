import React, { useLayoutEffect, useRef, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Play, Edit, Trash2, Copy } from 'lucide-react';
import { Command } from '../types/command';
import { TerminalType } from '../types/terminal';

const VIRTUALIZE_THRESHOLD = 300;
const ITEM_HEIGHT = 180;
const ITEM_GAP = 20;

interface CommandListProps {
  commands: Command[];
  onRun: (command: Command) => void;
  onEdit: (command: Command) => void;
  onDelete: (id: string) => void;
  onCopy: (command: Command) => void;
  defaultTerminalType: TerminalType;
  virtualized: boolean;
}

interface CommandRowData {
  commands: Command[];
  onRun: (command: Command) => void;
  onEdit: (command: Command) => void;
  onDelete: (id: string) => void;
  onCopy: (command: Command) => void;
  defaultTerminalType: TerminalType;
}

const CommandRow = ({ index, style, data }: ListChildComponentProps<CommandRowData>) => {
  const cmd = data.commands[index];
  const actualTerminalType = cmd.terminalType || data.defaultTerminalType;

  return (
    <div style={{ ...style, paddingBottom: ITEM_GAP }}>
      <div className="command-card">
        <div className="command-header">
          <h3 className="command-name">{cmd.name}</h3>
          <div className="command-actions">
            <button
              className="icon-btn"
              onClick={() => data.onRun(cmd)}
              title="运行命令"
            >
              <Play size={18} />
            </button>
            <button
              className="icon-btn"
              onClick={() => data.onEdit(cmd)}
              title="编辑命令"
            >
              <Edit size={18} />
            </button>
            <button
              className="icon-btn"
              onClick={() => data.onCopy(cmd)}
              title="复制命令"
            >
              <Copy size={18} />
            </button>
            <button
              className="icon-btn delete-btn"
              onClick={() => data.onDelete(cmd.id)}
              title="删除命令"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="command-content">
          <code>{cmd.command}</code>
        </div>

        {(cmd.tags && cmd.tags.length > 0) || cmd.terminalType ? (
          <div className="command-tags">
            <span
              className="terminal-badge"
              title={`使用 ${actualTerminalType === 'powershell' ? 'PowerShell' : 'CMD'} 执行`}
            >
              {actualTerminalType === 'powershell' ? 'PS' : 'CMD'}
            </span>
            {cmd.tags && cmd.tags.map((tag, tagIndex) => (
              <span key={tagIndex} className="tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const CommandList: React.FC<CommandListProps> = ({
  commands,
  onRun,
  onEdit,
  onDelete,
  onCopy,
  defaultTerminalType,
  virtualized,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const shouldVirtualize = virtualized && commands.length >= VIRTUALIZE_THRESHOLD;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(container);

    return () => observer.disconnect();
  }, [shouldVirtualize]);

  if (commands.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无命令</p>
        <p className="empty-hint">点击左侧 + 按钮添加新命令</p>
      </div>
    );
  }

  if (shouldVirtualize) {
    return (
      <div ref={containerRef} className="command-list-virtualized">
        {containerSize.height > 0 && containerSize.width > 0 ? (
          <List
            height={containerSize.height}
            width={containerSize.width}
            itemCount={commands.length}
            itemSize={ITEM_HEIGHT + ITEM_GAP}
            itemKey={(index, data) => data.commands[index].id}
            itemData={{
              commands,
              onRun,
              onEdit,
              onDelete,
              onCopy,
              defaultTerminalType,
            }}
          >
            {CommandRow}
          </List>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="command-list">
      {commands.map((cmd) => {
        const actualTerminalType = cmd.terminalType || defaultTerminalType;
        return (
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

            {(cmd.tags && cmd.tags.length > 0) || cmd.terminalType ? (
              <div className="command-tags">
                <span
                  className="terminal-badge"
                  title={`使用 ${actualTerminalType === 'powershell' ? 'PowerShell' : 'CMD'} 执行`}
                >
                  {actualTerminalType === 'powershell' ? 'PS' : 'CMD'}
                </span>
                {cmd.tags && cmd.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
