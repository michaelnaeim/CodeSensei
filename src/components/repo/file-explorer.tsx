"use client";

import { useState } from "react";
import { ChevronRight, File, Folder, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const path of paths) {
    const parts = path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const existing = current.find((n) => n.name === name);
      if (existing) {
        if (!existing.children) existing.children = [];
        current = existing.children;
      } else {
        const node: TreeNode = {
          name,
          path: parts.slice(0, i + 1).join("/"),
          children: i < parts.length - 1 ? [] : undefined,
        };
        current.push(node);
        if (node.children) current = node.children;
      }
    }
  }
  return root;
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const isDir = !!node.children;

  return (
    <div>
      <button
        onClick={() => isDir && setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-1.5 py-1 px-2 text-xs hover:bg-[var(--bg-elevated)] rounded cursor-pointer transition-colors",
          "text-[var(--text-secondary)]"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isDir ? (
          <>
            <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
            <Folder className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </>
        ) : (
          <>
            <span className="w-3" />
            <File className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && open && node.children?.map((child) => (
        <TreeItem key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function FileExplorer({ files, onClose }: { files: string[]; onClose: () => void }) {
  const tree = buildTree(files.slice(0, 200));

  return (
    <div className="w-56 border-r border-[var(--border)] bg-[var(--bg)] flex flex-col shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Explorer</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {tree.map((node) => (
          <TreeItem key={node.path} node={node} />
        ))}
      </div>
    </div>
  );
}
