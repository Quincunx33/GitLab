import React from 'react';
import { FileNode } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  onClose: () => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onRename: (path: string, name: string, type: 'file' | 'folder') => void;
  onDelete: (path: string, type: 'file' | 'folder', name: string) => void;
  onMove: (path: string, name: string, type: 'file' | 'folder') => void;
}

export const FileContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  node,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onMove,
}) => {
  const isFolder = node.type === 'folder';
  const parentPath = isFolder ? node.path : node.path.substring(0, node.path.lastIndexOf('/'));

  const menuStyle = {
    top: `${y}px`,
    left: `${x}px`,
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      className="fixed z-[100] w-48 bg-[#252526] border border-[#454545] rounded-md shadow-2xl py-1 text-xs text-[#d4d4d4] animate-in fade-in zoom-in-95 duration-100"
      style={menuStyle}
    >
      {isFolder && (
        <>
          <button
            onClick={() => handleAction(() => onNewFile(node.path))}
            className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
          >
            <i className="fas fa-file-circle-plus text-[10px]"></i> New File
          </button>
          <button
            onClick={() => handleAction(() => onNewFolder(node.path))}
            className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
          >
            <i className="fas fa-folder-plus text-[10px]"></i> New Folder
          </button>
          <div className="my-1 border-t border-[#454545]"></div>
        </>
      )}

      <button
        onClick={() => handleAction(() => onRename(node.path, node.name, node.type))}
        className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
      >
        <i className="fas fa-pen text-[10px]"></i> Rename
      </button>

      <button
        onClick={() => handleAction(() => onMove(node.path, node.name, node.type))}
        className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
      >
        <i className="fas fa-arrows-up-down-left-right text-[10px]"></i> Move
      </button>

      <div className="my-1 border-t border-[#454545]"></div>

      <button
        onClick={() => handleAction(() => onDelete(node.path, node.type, node.name))}
        className="w-full text-left px-3 py-1.5 hover:bg-rose-900/60 hover:text-rose-200 flex items-center gap-2 text-rose-400"
      >
        <i className="fas fa-trash-alt text-[10px]"></i> Delete
      </button>
    </div>
  );
};
