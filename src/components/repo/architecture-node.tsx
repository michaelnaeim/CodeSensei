"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Boxes, Database, Globe, Layout, Layers, Lock, Server, Shield, Zap } from "lucide-react";

const ICONS: Record<string, typeof Shield> = {
  shield: Shield,
  lock: Lock,
  layers: Layers,
  zap: Zap,
  server: Server,
  database: Database,
  globe: Globe,
  layout: Layout,
  boxes: Boxes,
};

export interface ArchNodeData {
  label: string;
  description: string;
  icon: string;
  pathCount: number;
  subCount: number;
  color: "blue" | "green" | "red" | "amber" | "purple" | "cyan";
  [key: string]: unknown;
}

const COLORS: Record<string, { dot: string; border: string }> = {
  blue: { dot: "bg-blue-400", border: "border-blue-800/40" },
  green: { dot: "bg-green-400", border: "border-green-800/40" },
  red: { dot: "bg-red-400", border: "border-red-800/40" },
  amber: { dot: "bg-amber-400", border: "border-amber-800/40" },
  purple: { dot: "bg-purple-400", border: "border-purple-800/40" },
  cyan: { dot: "bg-cyan-400", border: "border-cyan-800/40" },
};

export function ArchitectureNode({ data }: NodeProps) {
  const nodeData = data as ArchNodeData;
  const Icon = ICONS[nodeData.icon] ?? Boxes;
  const color = COLORS[nodeData.color] ?? COLORS.blue;

  return (
    <div className={`bg-[var(--bg-surface)] border ${color.border} rounded-xl p-4 min-w-[200px] max-w-[250px] hover:border-[var(--border-strong)] transition-colors`}>
      <Handle type="target" position={Position.Top} className="!bg-[var(--border-strong)] !border-none !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--border-strong)] !border-none !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-[var(--border-strong)] !border-none !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-[var(--border-strong)] !border-none !w-2 !h-2" />

      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
        <span className="text-sm font-medium text-[var(--text)]">{nodeData.label}</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3 line-clamp-2">
        {nodeData.description}
      </p>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{nodeData.pathCount} paths</span>
        {nodeData.subCount > 0 && (
          <span className="text-[var(--accent)]">{nodeData.subCount} sub &gt;</span>
        )}
      </div>
    </div>
  );
}
