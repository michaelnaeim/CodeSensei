"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArchitectureNode, type ArchNodeData } from "./architecture-node";
import { FileExplorer } from "./file-explorer";
import { FLOW_HEIGHT, FlowCanvas, FlowProvider } from "./flow-shell";
import { cn } from "@/lib/utils";
import type { BackendTopic } from "@/lib/api";

const SUB_TABS = ["Components", "Data Flow", "Dependencies", "Deployment"] as const;

const NODE_COLORS: Array<"blue" | "green" | "red" | "amber" | "purple" | "cyan"> = [
  "blue", "green", "red", "amber", "purple", "cyan",
];

const NODE_ICONS = ["layout", "layers", "server", "database", "shield", "globe", "zap", "lock", "boxes"];

function sortedTopics(topics: BackendTopic[]) {
  return [...topics].sort((a, b) => a.order - b.order);
}

function buildComponentGraph(topics: BackendTopic[]): { nodes: Node[]; edges: Edge[] } {
  const ordered = sortedTopics(topics);
  const nodes: Node[] = ordered.map((t, i) => ({
    id: t.id,
    type: "archNode",
    position: {
      x: (i % 3) * 280 + 80,
      y: Math.floor(i / 3) * 200 + 60,
    },
    data: {
      label: t.title,
      description: t.description,
      icon: NODE_ICONS[i % NODE_ICONS.length],
      pathCount: t.file_refs.length,
      subCount: Math.max(0, t.file_refs.length - 2),
      color: NODE_COLORS[i % NODE_COLORS.length],
    } satisfies ArchNodeData,
  }));

  const edges: Edge[] = [];
  for (let i = 1; i < ordered.length; i++) {
    edges.push({
        id: `e-${ordered[i - 1].id}-${ordered[i].id}`,
        source: ordered[i - 1].id,
        target: ordered[i].id,
        type: "default",
        style: { stroke: "#333", strokeWidth: 1, strokeDasharray: "4 4" },
      });
  }
  return { nodes, edges };
}

function buildFlowGraph(topics: BackendTopic[]): { nodes: Node[]; edges: Edge[] } {
  const sorted = sortedTopics(topics);
  const nodes: Node[] = sorted.map((t, i) => ({
    id: t.id,
    type: "archNode",
    position: { x: 120, y: i * 160 + 40 },
    data: {
      label: t.title,
      description: t.description,
      icon: NODE_ICONS[i % NODE_ICONS.length],
      pathCount: t.file_refs.length,
      subCount: 0,
      color: NODE_COLORS[i % NODE_COLORS.length],
    } satisfies ArchNodeData,
  }));

  const edges: Edge[] = [];
  for (let i = 1; i < sorted.length; i++) {
    edges.push({
      id: `flow-${sorted[i - 1].id}-${sorted[i].id}`,
      source: sorted[i - 1].id,
      target: sorted[i].id,
      label: "flows to",
      style: { stroke: "#3b82f6", strokeWidth: 1.5 },
    });
  }
  return { nodes, edges };
}

function buildDependencyGraph(topics: BackendTopic[]): { nodes: Node[]; edges: Edge[] } {
  const ordered = sortedTopics(topics);
  const nodes: Node[] = ordered.map((t, i) => ({
    id: t.id,
    type: "archNode",
    position: {
      x: (i % 4) * 240 + 40,
      y: Math.floor(i / 4) * 180 + 40,
    },
    data: {
      label: t.title,
      description: t.file_refs[0] ?? t.description,
      icon: NODE_ICONS[i % NODE_ICONS.length],
      pathCount: t.file_refs.length,
      subCount: Math.max(0, t.file_refs.length - 1),
      color: NODE_COLORS[i % NODE_COLORS.length],
    } satisfies ArchNodeData,
  }));

  const edges: Edge[] = [];
  for (let i = 1; i < ordered.length; i++) {
    edges.push({
      id: `dep-${ordered[i - 1].id}-${ordered[i].id}`,
      source: ordered[i - 1].id,
      target: ordered[i].id,
      style: { stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "4 4" },
    });
  }
  return { nodes, edges };
}

function ArchitectureTabInner({
  topics,
  fileTree,
}: {
  topics: BackendTopic[];
  fileTree: string[];
}) {
  const [subTab, setSubTab] = useState<typeof SUB_TABS[number]>("Components");
  const [explorerOpen, setExplorerOpen] = useState(true);

  const nodeTypes = useMemo(() => ({ archNode: ArchitectureNode }), []);

  const graphData = useMemo(() => {
    switch (subTab) {
      case "Data Flow": return buildFlowGraph(topics);
      case "Dependencies": return buildDependencyGraph(topics);
      case "Deployment": return buildComponentGraph(topics);
      default: return buildComponentGraph(topics);
    }
  }, [subTab, topics]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData, setNodes, setEdges]);

  const onSubTabChange = useCallback((tab: typeof SUB_TABS[number]) => {
    setSubTab(tab);
    const data = (() => {
      switch (tab) {
        case "Data Flow": return buildFlowGraph(topics);
        case "Dependencies": return buildDependencyGraph(topics);
        case "Deployment": return buildComponentGraph(topics);
        default: return buildComponentGraph(topics);
      }
    })();
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [topics, setNodes, setEdges]);

  return (
    <div className="flex overflow-hidden w-full h-full" style={{ minHeight: 480 }}>
      {explorerOpen && (
        <FileExplorer files={fileTree} onClose={() => setExplorerOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)] shrink-0">
          {SUB_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onSubTabChange(tab)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors",
                subTab === tab
                  ? "bg-[var(--bg-surface)] text-[var(--text)] border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
            >
              {tab}
            </button>
          ))}
          {!explorerOpen && (
            <button
              onClick={() => setExplorerOpen(true)}
              className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              Show explorer
            </button>
          )}
        </div>

        <p className="px-4 py-2 text-xs text-[var(--text-muted)] shrink-0">{subTab}</p>

        <div className="flex-1 min-w-0 min-h-0">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
          >
            <Background color="#1a1a1a" gap={20} size={1} />
            <Controls position="bottom-right" />
            <MiniMap
              nodeStrokeWidth={2}
              nodeColor="#262626"
              maskColor="rgba(0,0,0,0.6)"
              style={{ background: "#111" }}
            />
          </FlowCanvas>
        </div>
      </div>
    </div>
  );
}

export function ArchitectureTab({
  topics,
  fileTree,
}: {
  topics: BackendTopic[];
  fileTree: string[];
}) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]" style={{ height: FLOW_HEIGHT }}>
        No topics indexed yet for this repository.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: FLOW_HEIGHT, minHeight: 480 }}>
      <FlowProvider>
        <ArchitectureTabInner topics={topics} fileTree={fileTree} />
      </FlowProvider>
    </div>
  );
}
