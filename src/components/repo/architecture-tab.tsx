"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
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
import { cn } from "@/lib/utils";
import type { BackendTopic } from "@/lib/api";

const SUB_TABS = ["Components", "Data Flow", "Dependencies", "Deployment"] as const;

const NODE_COLORS: Array<"blue" | "green" | "red" | "amber" | "purple" | "cyan"> = [
  "blue", "green", "red", "amber", "purple", "cyan",
];

const NODE_ICONS = ["layout", "layers", "server", "database", "shield", "globe", "zap", "lock", "boxes"];

function buildComponentGraph(topics: BackendTopic[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = topics.map((t, i) => ({
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
  for (let i = 1; i < topics.length; i++) {
    if (topics[i].order - topics[i - 1].order <= 2) {
      edges.push({
        id: `e-${topics[i - 1].id}-${topics[i].id}`,
        source: topics[i - 1].id,
        target: topics[i].id,
        type: "default",
        style: { stroke: "#333", strokeWidth: 1, strokeDasharray: "4 4" },
      });
    }
  }
  return { nodes, edges };
}

function buildDataFlowGraph(topics: BackendTopic[]): { nodes: Node[]; edges: Edge[] } {
  const layers = [
    { id: "ui", label: "User Interface", desc: "User events and interactions", icon: "layout", color: "green" as const },
    { id: "router", label: "Router", desc: "Request routing and dispatch", icon: "layers", color: "green" as const },
    { id: "handlers", label: "API Handlers", desc: "Business logic processing", icon: "server", color: "green" as const },
    { id: "data", label: "Data Layer", desc: "Storage and persistence", icon: "database", color: "blue" as const },
    { id: "auth", label: "Auth Layer", desc: "Authentication and access control", icon: "shield", color: "red" as const },
  ];

  const nodes: Node[] = layers.map((l, i) => ({
    id: l.id,
    type: "archNode",
    position: { x: (i % 3) * 280 + 80, y: Math.floor(i / 3) * 200 + 60 },
    data: {
      label: l.label,
      description: l.desc,
      icon: l.icon,
      pathCount: Math.ceil(topics.length / layers.length * (i + 1)),
      subCount: i < 3 ? 4 : 0,
      color: l.color,
    } satisfies ArchNodeData,
  }));

  const edges: Edge[] = [
    { id: "e-ui-router", source: "ui", target: "router", label: "User Events", style: { stroke: "#333" } },
    { id: "e-router-handlers", source: "router", target: "handlers", label: "HTTP Request", style: { stroke: "#333" } },
    { id: "e-handlers-data", source: "handlers", target: "data", label: "Handler", style: { stroke: "#333", strokeDasharray: "4 4" } },
    { id: "e-handlers-auth", source: "handlers", target: "auth", label: "Auth Check", style: { stroke: "#333", strokeDasharray: "4 4" } },
  ];

  return { nodes, edges };
}

function buildDeploymentGraph(topics: BackendTopic[]): { nodes: Node[]; edges: Edge[] } {
  const services = [
    { id: "browser", label: "Client Browser", desc: "End user's browser or device", icon: "globe", color: "blue" as const, x: 300, y: 20 },
    { id: "cdn", label: "CDN / Edge", desc: "Static asset delivery and edge caching", icon: "zap", color: "cyan" as const, x: 300, y: 180 },
    { id: "app", label: "Application Server", desc: "Main application runtime", icon: "server", color: "green" as const, x: 300, y: 340 },
    { id: "db", label: "Database", desc: "Data store", icon: "database", color: "blue" as const, x: 300, y: 500 },
    { id: "apis", label: "External APIs", desc: "Third-party services", icon: "globe", color: "cyan" as const, x: 80, y: 500 },
    { id: "authsvc", label: "Auth Service", desc: "Authentication and session management", icon: "shield", color: "red" as const, x: 520, y: 500 },
  ];

  const nodes: Node[] = services.map((s) => ({
    id: s.id,
    type: "archNode",
    position: { x: s.x, y: s.y },
    data: {
      label: s.label,
      description: s.desc,
      icon: s.icon,
      pathCount: Math.ceil(topics.length / services.length * 2),
      subCount: 0,
      color: s.color,
    } satisfies ArchNodeData,
  }));

  const edges: Edge[] = [
    { id: "e-b-cdn", source: "browser", target: "cdn", label: "HTTPS", style: { stroke: "#333" } },
    { id: "e-cdn-app", source: "cdn", target: "app", label: "Origin", style: { stroke: "#333" } },
    { id: "e-app-db", source: "app", target: "db", label: "SQL/API", style: { stroke: "#333" } },
    { id: "e-app-apis", source: "app", target: "apis", label: "HTTP", style: { stroke: "#333", strokeDasharray: "4 4" } },
    { id: "e-app-auth", source: "app", target: "authsvc", label: "Auth Check", style: { stroke: "#333", strokeDasharray: "4 4" } },
  ];

  return { nodes, edges };
}

export function ArchitectureTab({
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
      case "Data Flow": return buildDataFlowGraph(topics);
      case "Deployment": return buildDeploymentGraph(topics);
      case "Dependencies": return buildComponentGraph(topics);
      default: return buildComponentGraph(topics);
    }
  }, [subTab, topics]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  const onSubTabChange = useCallback((tab: typeof SUB_TABS[number]) => {
    setSubTab(tab);
    const data = (() => {
      switch (tab) {
        case "Data Flow": return buildDataFlowGraph(topics);
        case "Deployment": return buildDeploymentGraph(topics);
        case "Dependencies": return buildComponentGraph(topics);
        default: return buildComponentGraph(topics);
      }
    })();
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [topics, setNodes, setEdges]);

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 100px)" }}>
      {explorerOpen && (
        <FileExplorer files={fileTree} onClose={() => setExplorerOpen(false)} />
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)]">
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

        <p className="px-4 py-2 text-xs text-[var(--text-muted)]">{subTab}</p>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.3}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1a1a1a" gap={20} size={1} />
            <Controls position="bottom-right" />
            <MiniMap
              nodeStrokeWidth={2}
              nodeColor="#262626"
              maskColor="rgba(0,0,0,0.6)"
              style={{ background: "#111" }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
