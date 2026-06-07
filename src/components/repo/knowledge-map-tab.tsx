"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { ArrowRight, FileText, Network, Search } from "lucide-react";
import type { BackendTopic } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SimNode extends SimulationNodeDatum {
  id: string;
}

/**
 * Run a d3-force simulation synchronously to compute physics-based positions
 * (nodes repel each other, linked nodes attract). Returns a map of id -> {x,y}.
 */
function computeForceLayout(
  topics: BackendTopic[],
  links: { source: string; target: string }[]
): Record<string, { x: number; y: number }> {
  const simNodes: SimNode[] = topics.map((t) => ({ id: t.id }));
  const simLinks: SimulationLinkDatum<SimNode>[] = links.map((l) => ({
    source: l.source,
    target: l.target,
  }));

  const simulation = forceSimulation(simNodes)
    .force("charge", forceManyBody().strength(-650))
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
        .id((d) => d.id)
        .distance(170)
        .strength(0.4)
    )
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(95))
    .stop();

  const ticks = 320;
  for (let i = 0; i < ticks; i++) simulation.tick();

  const positions: Record<string, { x: number; y: number }> = {};
  for (const node of simNodes) {
    positions[node.id] = { x: node.x ?? 0, y: node.y ?? 0 };
  }
  return positions;
}

type ConceptStatus = "locked" | "next" | "active" | "completed";

interface ConceptNodeData {
  label: string;
  fileCount: number;
  status: ConceptStatus;
  selected: boolean;
  dimmed: boolean;
  showFiles: boolean;
  [key: string]: unknown;
}

function ConceptNode({ data }: NodeProps) {
  const d = data as ConceptNodeData;
  const isHighlight = d.status === "active" || d.status === "next" || d.selected;
  const borderColor = d.selected
    ? "border-[var(--node-active)] ring-1 ring-[var(--node-active)]"
    : isHighlight
    ? "border-[var(--node-active)]"
    : d.status === "completed"
    ? "border-green-700"
    : "border-[var(--border)]";
  const bg = isHighlight ? "bg-[var(--node-active-soft)]" : "bg-[var(--bg-surface)]";

  return (
    <div
      className={cn(
        bg,
        borderColor,
        "border rounded-xl px-5 py-3 min-w-[150px] text-center transition-all",
        d.dimmed ? "opacity-25" : "opacity-100 hover:border-[var(--border-strong)]"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <Handle type="target" position={Position.Left} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-[var(--border-strong)] !border-none !w-1.5 !h-1.5" />
      <p className={cn("text-sm font-medium", isHighlight ? "text-[var(--node-active)]" : "text-[var(--text)]")}>
        {d.label}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{d.fileCount} files</p>
      {d.showFiles && (
        <div className="mt-1 text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-jetbrains)]">
          {d.fileCount > 0 ? "src/…" : "—"}
        </div>
      )}
    </div>
  );
}

function statusFor(topic: BackendTopic, index: number): ConceptStatus {
  if (topic.cleared) return "completed";
  if (index === 0) return "next";
  return "locked";
}

/**
 * Builds the concept graph. Two layout modes:
 * - hierarchy: layered top-down grid with the root concept as a hub
 * - force (default): d3-force physics simulation (nodes repel, links attract)
 *   producing organic clusters like the Remora knowledge map.
 */
function buildKnowledgeGraph(
  topics: BackendTopic[],
  opts: { selectedId: string | null; query: string; showFiles: boolean; hierarchy: boolean }
): { nodes: Node[]; edges: Edge[] } {
  if (topics.length === 0) return { nodes: [], edges: [] };

  const query = opts.query.trim().toLowerCase();
  const hub = topics[0];
  const rest = topics.slice(1);
  const perRow = Math.max(3, Math.ceil(Math.sqrt(rest.length)) + 1);

  const matches = (t: BackendTopic) =>
    !query || t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);

  // Define logical links first (used by both edges and the force layout)
  const hubLinks = rest.map((t) => ({ source: hub.id, target: t.id }));
  const seqLinks: { source: string; target: string }[] = [];
  for (let i = 1; i < topics.length - 1; i++) {
    seqLinks.push({ source: topics[i].id, target: topics[i + 1].id });
  }
  const allLinks = [...hubLinks, ...seqLinks];

  // Compute positions
  const positions: Record<string, { x: number; y: number }> = {};
  if (opts.hierarchy) {
    topics.forEach((t, i) => {
      if (i === 0) {
        positions[t.id] = { x: ((perRow - 1) * 220) / 2, y: 0 };
      } else {
        const idx = i - 1;
        positions[t.id] = {
          x: (idx % perRow) * 220,
          y: (Math.floor(idx / perRow) + 1) * 200 + 60,
        };
      }
    });
  } else {
    Object.assign(positions, computeForceLayout(topics, allLinks));
  }

  const nodes: Node[] = topics.map((t, i) => ({
    id: t.id,
    type: "conceptNode",
    position: positions[t.id] ?? { x: 0, y: 0 },
    data: {
      label: t.title,
      fileCount: t.file_refs.length,
      status: statusFor(t, i),
      selected: opts.selectedId === t.id,
      dimmed: !!query && !matches(t),
      showFiles: opts.showFiles,
    } satisfies ConceptNodeData,
  }));

  const edges: Edge[] = [];

  // Hub radiates to every other concept (next-to-learn, blue glowing curves)
  for (const t of rest) {
    const active = opts.selectedId === hub.id || opts.selectedId === t.id || !opts.selectedId;
    edges.push({
      id: `hub-${hub.id}-${t.id}`,
      source: hub.id,
      target: t.id,
      type: "default",
      style: {
        stroke: "#3b82f6",
        strokeWidth: opts.selectedId === t.id ? 2.5 : 1.5,
        opacity: active ? 0.7 : 0.12,
        filter: "drop-shadow(0 0 3px rgba(59,130,246,0.5))",
      },
    });
  }

  // Sequential prerequisite links (amber) between consecutive concepts
  for (const link of seqLinks) {
    edges.push({
      id: `seq-${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      type: "default",
      style: { stroke: "#f59e0b", strokeWidth: 1, opacity: 0.4, strokeDasharray: "4 4" },
    });
  }

  return { nodes, edges };
}

export function KnowledgeMapTab({
  topics,
  onStartLesson,
}: {
  topics: BackendTopic[];
  repoId: string;
  onStartLesson: (topicId: string) => void;
}) {
  const nodeTypes = useMemo(() => ({ conceptNode: ConceptNode }), []);
  const [selectedId, setSelectedId] = useState<string | null>(topics[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [hierarchy, setHierarchy] = useState(false);

  const graph = useMemo(
    () => buildKnowledgeGraph(topics, { selectedId, query, showFiles, hierarchy }),
    [topics, selectedId, query, showFiles, hierarchy]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  const completedCount = topics.filter((t) => t.cleared).length;
  const selectedTopic = topics.find((t) => t.id === selectedId) ?? topics[0];
  const techCount = new Set(topics.flatMap((t) => t.file_refs.map((f) => f.split(".").pop()))).size;

  return (
    <div className="flex flex-1 overflow-hidden relative" style={{ height: "calc(100vh - 100px)" }}>
      <div className="flex-1 relative">
        {/* Top toolbar */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search"
              className="bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none w-24"
            />
          </div>
          <button
            onClick={() => setHierarchy((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border cursor-pointer transition-colors",
              hierarchy
                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            <Network className="w-3.5 h-3.5" />
            hierarchy
          </button>
          <button
            onClick={() => setShowFiles((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border cursor-pointer transition-colors",
              showFiles
                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            show files
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1a1a1a" gap={20} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            nodeStrokeWidth={2}
            nodeColor={(n) => ((n.data as ConceptNodeData)?.selected ? "#f59e0b" : "#262626")}
            maskColor="rgba(0,0,0,0.6)"
            style={{ background: "#111" }}
          />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute bottom-12 left-4 panel p-3 text-xs space-y-2 z-10">
          <p className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
            {topics.length} concepts · {techCount} technologies
          </p>
          <div className="space-y-1">
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
          <div className="flex items-center gap-3 pt-1 border-t border-[var(--border)]">
            {[
              { color: "border-blue-400", label: "concept" },
              { color: "border-[var(--node-active)]", label: "prerequisite" },
              { color: "border-[var(--border-strong)]", label: "locked" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <span className={`w-2.5 h-2.5 rounded border ${item.color}`} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning path sidebar */}
      <div className="w-72 border-l border-[var(--border)] bg-[var(--bg)] overflow-auto shrink-0">
        <div className="p-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5" />
            Learning Path
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            {completedCount}/{topics.length} concepts completed
          </p>
        </div>

        {/* Selected concept highlight */}
        {selectedTopic && (
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-surface)]">
            <p className="text-sm font-semibold text-[var(--text)]">{selectedTopic.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{selectedTopic.description}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-2 font-[family-name:var(--font-jetbrains)]">
              {selectedTopic.file_refs.length} files
            </p>
            <button
              onClick={() => onStartLesson(selectedTopic.id)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/20 cursor-pointer transition-colors"
            >
              <ArrowRight className="w-3 h-3" />
              start lesson
            </button>
          </div>
        )}

        <div className="p-3 space-y-1">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedId(topic.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors cursor-pointer",
                selectedId === topic.id
                  ? "border-[var(--node-active)] bg-[var(--node-active-soft)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]"
              )}
            >
              <p className="text-sm font-medium text-[var(--text)]">{topic.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{topic.description}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 font-[family-name:var(--font-jetbrains)]">
                {topic.file_refs.length} files
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
