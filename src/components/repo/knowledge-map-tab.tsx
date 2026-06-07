"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FLOW_HEIGHT, FlowCanvas, FlowProvider } from "./flow-shell";
import { ArrowRight, BookOpen, FileText, Network, Search } from "lucide-react";
import type { BackendTopic } from "@/lib/api";
import { cn } from "@/lib/utils";

const COLS = 4;
const COL_W = 230;
const ROW_H = 170;

type ConceptStatus = "locked" | "next" | "active" | "completed";

interface ConceptNodeData {
  label: string;
  fileCount: number;
  filePreview: string;
  status: ConceptStatus;
  selected: boolean;
  dimmed: boolean;
  showFiles: boolean;
  isHub: boolean;
  [key: string]: unknown;
}

function ConceptNode({ data }: NodeProps) {
  const d = data as ConceptNodeData;
  const isHighlight =
    d.isHub || d.selected || d.status === "next" || d.status === "active";
  const isLocked = d.status === "locked" && !d.selected;

  return (
    <div
      className={cn(
        "border rounded-xl px-4 py-3 text-center transition-all",
        d.isHub ? "km-node-hub min-w-[200px]" : "min-w-[160px] max-w-[210px]",
        isHighlight
          ? "bg-[var(--node-active-soft)] border-[var(--node-active)]"
          : d.status === "completed"
          ? "bg-[var(--bg-surface)] border-green-700/60"
          : "bg-[var(--bg-surface)] border-[var(--border)]",
        d.selected && "ring-2 ring-[var(--node-active)] ring-offset-2 ring-offset-[var(--bg)]",
        d.dimmed && "opacity-20",
        isLocked && !d.dimmed && "opacity-70",
        !d.dimmed && "hover:border-[var(--border-strong)]"
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />

      <p
        className={cn(
          "text-sm font-medium leading-snug",
          isHighlight ? "text-[var(--node-active)]" : "text-[var(--text)]"
        )}
      >
        {d.label}
        <span className="text-[var(--text-muted)] font-normal">
          {" "}({d.fileCount} {d.fileCount === 1 ? "file" : "files"})
        </span>
      </p>
      {d.showFiles && d.filePreview && (
        <p className="mt-1 text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-jetbrains)] truncate">
          {d.filePreview}
        </p>
      )}
    </div>
  );
}

function statusFor(topic: BackendTopic, topics: BackendTopic[]): ConceptStatus {
  if (topic.cleared) return "completed";
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const firstUncleared = sorted.find((t) => !t.cleared);
  if (firstUncleared?.id === topic.id) return "next";
  const idx = sorted.findIndex((t) => t.id === topic.id);
  if (idx <= 0 || sorted[idx - 1]?.cleared) return "active";
  return "locked";
}

/** Remora-style hub tree: root on top, children in rows of 4, grey links down columns */
function buildRemoraLayout(ordered: BackendTopic[]): {
  positions: Record<string, { x: number; y: number }>;
  hub: BackendTopic;
  tiers: BackendTopic[][];
} {
  const positions: Record<string, { x: number; y: number }> = {};
  if (ordered.length === 0) {
    return { positions, hub: ordered[0], tiers: [] };
  }

  const hub = ordered[0];
  const rest = ordered.slice(1);
  const tiers: BackendTopic[][] = [];

  if (rest.length > 0) {
    tiers.push(rest.slice(0, COLS));
    let remaining = rest.slice(COLS);
    while (remaining.length > 0) {
      tiers.push(remaining.slice(0, COLS));
      remaining = remaining.slice(COLS);
    }
  }

  const maxCols = Math.max(COLS, ...tiers.map((t) => t.length), 1);
  const centerX = ((maxCols - 1) * COL_W) / 2;

  positions[hub.id] = { x: centerX, y: 20 };

  tiers.forEach((row, tierIdx) => {
    const rowWidth = (row.length - 1) * COL_W;
    const startX = centerX - rowWidth / 2;
    row.forEach((topic, colIdx) => {
      positions[topic.id] = {
        x: startX + colIdx * COL_W,
        y: 150 + tierIdx * ROW_H,
      };
    });
  });

  return { positions, hub, tiers };
}

function buildKnowledgeGraph(
  topics: BackendTopic[],
  opts: {
    selectedId: string | null;
    query: string;
    showFiles: boolean;
    hierarchy: boolean;
  }
): { nodes: Node[]; edges: Edge[] } {
  if (topics.length === 0) return { nodes: [], edges: [] };

  const ordered = [...topics].sort((a, b) => a.order - b.order);
  const query = opts.query.trim().toLowerCase();
  const matches = (t: BackendTopic) =>
    !query ||
    t.title.toLowerCase().includes(query) ||
    t.description.toLowerCase().includes(query);

  const { positions, hub, tiers } = buildRemoraLayout(ordered);
  const rest = ordered.slice(1);

  const nodes: Node[] = ordered.map((t) => ({
    id: t.id,
    type: "conceptNode",
    position: positions[t.id] ?? { x: 0, y: 0 },
    data: {
      label: t.title,
      fileCount: t.file_refs.length || 1,
      filePreview: t.file_refs[0] ?? "",
      status: statusFor(t, ordered),
      selected: opts.selectedId === t.id,
      dimmed: !matches(t),
      showFiles: opts.showFiles,
      isHub: t.id === hub.id,
    } satisfies ConceptNodeData,
  }));

  const edges: Edge[] = [];

  // Blue hub spokes → first tier only (like Remora)
  const tier1 = tiers[0] ?? [];
  for (const child of tier1) {
    const lit =
      opts.selectedId === hub.id ||
      opts.selectedId === child.id ||
      !opts.selectedId;
    edges.push({
      id: `hub-${hub.id}-${child.id}`,
      source: hub.id,
      target: child.id,
      type: "smoothstep",
      style: {
        stroke: "#3b82f6",
        strokeWidth: lit ? 2.5 : 1.5,
        opacity: lit ? 0.85 : 0.2,
      },
    });
  }

  // Grey column links between tiers (parent column → child below)
  for (let ti = 0; ti < tiers.length - 1; ti++) {
    const upper = tiers[ti];
    const lower = tiers[ti + 1];
    const len = Math.min(upper.length, lower.length);
    for (let c = 0; c < len; c++) {
      edges.push({
        id: `col-${upper[c].id}-${lower[c].id}`,
        source: upper[c].id,
        target: lower[c].id,
        type: "smoothstep",
        style: {
          stroke: "#525252",
          strokeWidth: 1,
          opacity: 0.55,
          strokeDasharray: "5 4",
        },
      });
    }
  }

  // Amber prerequisite chain along learning order
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    if (a.id === hub.id && tier1.some((t) => t.id === b.id)) continue;
    edges.push({
      id: `seq-${a.id}-${b.id}`,
      source: a.id,
      target: b.id,
      type: "smoothstep",
      style: {
        stroke: "#f59e0b",
        strokeWidth: 1,
        opacity: 0.25,
        strokeDasharray: "4 4",
      },
    });
  }

  // If only hub + orphans without tier layout, connect hub to all
  if (tier1.length === 0 && rest.length > 0) {
    for (const child of rest) {
      edges.push({
        id: `hub-${hub.id}-${child.id}`,
        source: hub.id,
        target: child.id,
        type: "smoothstep",
        style: { stroke: "#3b82f6", strokeWidth: 2, opacity: 0.7 },
      });
    }
  }

  return { nodes, edges };
}

function KnowledgeMapInner({
  topics,
  techCount,
  onStartLesson,
}: {
  topics: BackendTopic[];
  techCount: number;
  onStartLesson: (topicId: string) => void;
}) {
  const nodeTypes = useMemo(() => ({ conceptNode: ConceptNode }), []);
  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => a.order - b.order),
    [topics]
  );

  const nextTopicId = useMemo(() => {
    const next = sortedTopics.find((t) => !t.cleared);
    return next?.id ?? sortedTopics[0]?.id ?? null;
  }, [sortedTopics]);

  const [selectedId, setSelectedId] = useState<string | null>(nextTopicId);
  const [query, setQuery] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [hierarchy, setHierarchy] = useState(true);

  useEffect(() => {
    if (nextTopicId) setSelectedId(nextTopicId);
  }, [nextTopicId]);

  const graph = useMemo(
    () =>
      buildKnowledgeGraph(topics, {
        selectedId,
        query,
        showFiles,
        hierarchy,
      }),
    [topics, selectedId, query, showFiles, hierarchy]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  const completedCount = sortedTopics.filter((t) => t.cleared).length;

  return (
    <div className="flex overflow-hidden w-full h-full relative bg-[var(--bg)]">
      <div className="flex-1 min-w-0 min-h-0 relative">
        {/* Centered toolbar — Remora style */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[var(--bg-surface)]/95 backdrop-blur border border-[var(--border)] rounded-lg px-3 py-1.5 shadow-lg">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search"
              className="bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none w-28"
            />
            <span className="text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)]">
              ⌘K
            </span>
          </div>
          <button
            onClick={() => setHierarchy((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border cursor-pointer transition-colors backdrop-blur",
              hierarchy
                ? "bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text)]"
                : "bg-[var(--bg-surface)]/95 border-[var(--border)] text-[var(--text-muted)]"
            )}
          >
            <Network className="w-3.5 h-3.5" />
            hierarchy
          </button>
          <button
            onClick={() => setShowFiles((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border cursor-pointer transition-colors backdrop-blur",
              showFiles
                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                : "bg-[var(--bg-surface)]/95 border-[var(--border)] text-[var(--text-muted)]"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            show files
          </button>
        </div>

        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={setSelectedId}
          nodeTypes={nodeTypes}
        >
          <Background color="#141414" gap={24} size={1} />
          <Controls position="bottom-right" showInteractive={false} />
        </FlowCanvas>

        {/* Legend — bottom left */}
        <div className="absolute bottom-10 left-4 panel p-3 text-xs space-y-2 z-10 max-w-[220px]">
          <p className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
            {sortedTopics.length} concepts · {techCount} technologies
          </p>
          <div className="space-y-1.5">
            {[
              { color: "bg-[var(--node-active)]", label: "prerequisite", arrow: true },
              { color: "bg-[var(--border-strong)]", label: "related", dashed: true },
              { color: "bg-blue-400", label: "next to learn" },
              { color: "bg-green-500", label: "completed" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[var(--text-muted)]">
                <span
                  className={cn(
                    "w-5 h-0.5 shrink-0",
                    item.color,
                    item.dashed && "opacity-60"
                  )}
                />
                {item.arrow && <span className="text-[10px]">→</span>}
                {item.label}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 border-t border-[var(--border)]">
            {[
              { color: "border-blue-400/80", label: "concept" },
              { color: "border-[var(--node-active)]", label: "prerequisite" },
              { color: "border-[var(--border-strong)]", label: "locked" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <span className={cn("w-2.5 h-2.5 rounded-sm border", item.color)} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning path sidebar */}
      <div className="w-[300px] border-l border-[var(--border)] bg-[var(--bg)] overflow-auto shrink-0 flex flex-col">
        <div className="p-4 border-b border-[var(--border)] shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Learning Path
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            {completedCount}/{sortedTopics.length} concepts completed
          </p>
        </div>

        <div className="p-2 space-y-1 flex-1 overflow-auto">
          {sortedTopics.map((topic) => {
            const isSelected = selectedId === topic.id;
            const isNext = statusFor(topic, sortedTopics) === "next";
            const showContinue = isSelected || isNext;

            return (
              <div
                key={topic.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(topic.id)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedId(topic.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors cursor-pointer",
                  showContinue
                    ? "border-[var(--border-strong)] bg-[var(--bg-surface)]"
                    : "border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-muted)]"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {showContinue ? (
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/40 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
                    </div>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] leading-snug">
                      {topic.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                      {topic.file_refs.length || 1} files
                    </p>
                    {showContinue && isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartLesson(topic.id);
                        }}
                        className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer transition-colors"
                      >
                        continue lesson
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function KnowledgeMapTab({
  topics,
  techCount = 1,
  onStartLesson,
}: {
  topics: BackendTopic[];
  repoId: string;
  techCount?: number;
  onStartLesson: (topicId: string) => void;
}) {
  if (topics.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]"
        style={{ height: FLOW_HEIGHT }}
      >
        No concepts found. Try re-indexing this repository.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: FLOW_HEIGHT, minHeight: 480 }}>
      <FlowProvider>
        <KnowledgeMapInner
          topics={topics}
          techCount={techCount}
          onStartLesson={onStartLesson}
        />
      </FlowProvider>
    </div>
  );
}
