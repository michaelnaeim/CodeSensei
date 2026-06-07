"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowRight } from "lucide-react";
import type { BackendTopic } from "@/lib/api";

interface ConceptNodeData {
  label: string;
  fileCount: number;
  status: "locked" | "next" | "active" | "completed";
  [key: string]: unknown;
}

function ConceptNode({ data }: NodeProps) {
  const d = data as ConceptNodeData;
  const borderColor =
    d.status === "active" || d.status === "next"
      ? "border-[var(--node-active)]"
      : d.status === "completed"
      ? "border-green-700"
      : "border-[var(--border)]";
  const bg =
    d.status === "active" || d.status === "next"
      ? "bg-[var(--node-active-soft)]"
      : "bg-[var(--bg-surface)]";

  return (
    <div className={`${bg} border ${borderColor} rounded-xl px-5 py-3 min-w-[140px] text-center hover:border-[var(--border-strong)] transition-colors`}>
      <Handle type="target" position={Position.Top} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <Handle type="target" position={Position.Left} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <p className="text-sm font-medium text-[var(--text)]">{d.label}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{d.fileCount} files</p>
    </div>
  );
}

function buildKnowledgeGraph(topics: BackendTopic[]): { nodes: Node[]; edges: Edge[] } {
  const cols = Math.min(4, Math.ceil(Math.sqrt(topics.length)));
  const nodes: Node[] = topics.map((t, i) => ({
    id: t.id,
    type: "conceptNode",
    position: {
      x: (i % cols) * 220 + 60,
      y: Math.floor(i / cols) * 160 + 60,
    },
    data: {
      label: t.title,
      fileCount: t.file_refs.length,
      status: t.cleared ? "completed" : i === 0 ? "next" : "locked",
    } satisfies ConceptNodeData,
  }));

  const edges: Edge[] = [];
  for (let i = 1; i < topics.length; i++) {
    const prevRow = Math.floor((i - 1) / cols);
    const curRow = Math.floor(i / cols);
    if (prevRow === curRow) {
      edges.push({
        id: `km-${topics[i - 1].id}-${topics[i].id}`,
        source: topics[i - 1].id,
        target: topics[i].id,
        style: { stroke: "#f59e0b", strokeWidth: 1.5 },
      });
    } else if ((i - 1) % cols === i % cols || i % cols === 0) {
      edges.push({
        id: `km-${topics[Math.max(0, i - cols)].id}-${topics[i].id}`,
        source: topics[Math.max(0, i - cols)].id,
        target: topics[i].id,
        style: { stroke: "#333", strokeWidth: 1, strokeDasharray: "4 4" },
      });
    }
  }
  return { nodes, edges };
}

export function KnowledgeMapTab({
  topics,
  repoId,
  onStartLesson,
}: {
  topics: BackendTopic[];
  repoId: string;
  onStartLesson: (topicId: string) => void;
}) {
  const nodeTypes = useMemo(() => ({ conceptNode: ConceptNode }), []);
  const graph = useMemo(() => buildKnowledgeGraph(topics), [topics]);
  const [nodes, , onNodesChange] = useNodesState(graph.nodes);
  const [edges, , onEdgesChange] = useEdgesState(graph.edges);

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 100px)" }}>
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
          <Controls position="bottom-left" />
          <MiniMap
            nodeStrokeWidth={2}
            nodeColor="#262626"
            maskColor="rgba(0,0,0,0.6)"
            style={{ background: "#111" }}
          />
        </ReactFlow>

        <div className="absolute bottom-12 left-4 panel p-3 text-xs space-y-1.5 z-10">
          <p className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px] mb-2">
            {topics.length} concepts
          </p>
          {[
            { color: "bg-[var(--node-active)]", label: "prerequisite" },
            { color: "bg-[var(--border-strong)]", label: "related", dashed: true },
            { color: "bg-blue-400", label: "next to learn" },
            { color: "bg-green-400", label: "completed" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[var(--text-muted)]">
              <span className={`w-4 h-0.5 ${item.color} ${item.dashed ? "opacity-50" : ""}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="w-72 border-l border-[var(--border)] bg-[var(--bg)] overflow-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Learning Path</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">0/{topics.length} concepts completed</p>
        </div>

        <div className="p-3 space-y-1">
          {topics.map((topic, i) => (
            <div key={topic.id} className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors">
              <p className="text-sm font-medium text-[var(--text)]">{topic.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{topic.description}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{topic.file_refs.length} files</p>
              {i === 0 && (
                <button
                  onClick={() => onStartLesson(topic.id)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text)] cursor-pointer transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  start lesson
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
