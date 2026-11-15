import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ancestors, byId, depth, descendants, GROUPS, TOPICS } from "../data/topics";
import { useDone } from "../lib/progress";

// Chapdan o'ngga joylashuv: ustun = "qavat" (oldingi mavzular zanjiri uzunligi).
// Ekran keng bo'lgani uchun bu shaklda graf kattaroq masshtabda sig'adi va matn o'qiladi.
const COL_W = 178;
const ROW_H = 100;

export function MapPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [sel, setSel] = useState<string | null>(params.get("t"));
  const done = useDone();

  const { nodes, edges } = useMemo(() => {
    const up = sel ? ancestors(sel) : new Set<string>();
    const down = sel ? descendants(sel) : new Set<string>();
    const rows: Record<number, string[]> = {};
    TOPICS.forEach((t) => (rows[depth(t.id)] ??= []).push(t.id));

    const nodes: Node[] = TOPICS.map((t) => {
      const d = depth(t.id);
      const row = rows[d];
      const i = row.indexOf(t.id);
      const ready = t.prereqs.every((p) => done.includes(p.id));
      const role = !sel ? "" : t.id === sel ? "sel" : up.has(t.id) ? "up" : down.has(t.id) ? "down" : "far";
      return {
        id: t.id,
        position: { x: d * COL_W, y: (i - (row.length - 1) / 2) * ROW_H },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: <div className="n-title">{t.title}</div>,
        },
        className: ["kn", role, done.includes(t.id) ? "done" : ready ? "ready" : ""].join(" "),
        style: { ["--g" as string]: GROUPS[t.group].color },
      };
    });
    const edges: Edge[] = TOPICS.flatMap((t) =>
      t.prereqs.map((p) => {
        const onPath = sel && (
          (t.id === sel || up.has(t.id)) && (up.has(p.id)) ||
          (p.id === sel || down.has(p.id)) && (down.has(t.id))
        );
        const isUp = sel && (t.id === sel || up.has(t.id)) && up.has(p.id);
        return {
          id: p.id + "-" + t.id,
          source: p.id,
          target: t.id,
          animated: !!onPath,
          markerEnd: { type: MarkerType.ArrowClosed, color: onPath ? (isUp ? "#ffd166" : "#58c4dd") : "#555" },
          style: { stroke: onPath ? (isUp ? "#ffd166" : "#58c4dd") : "#555", strokeWidth: onPath ? 2.5 : 1.2, opacity: sel && !onPath ? 0.25 : 1 },
        };
      }),
    );
    return { nodes, edges };
  }, [sel, done]);

  const s = sel ? byId[sel] : null;

  return (
    <div className="map-page">
      <div className="map-info">
        <h1>Bilim xaritasi</h1>
        <p>
          Strelka <b>A → B</b> degani: <i>B ni tushunish uchun A kerak</i>. Mavzuni bosing — unga olib boruvchi zanjir{" "}
          <span style={{ color: "#ffd166" }}>sariq</span>, undan keyin ochiladigan mavzular{" "}
          <span style={{ color: "#58c4dd" }}>ko'k</span> bo'lib yonadi. Ikki marta bosing — darsga o'tasiz.
        </p>
        <div className="legend">
          {Object.values(GROUPS).map((g) => (
            <span key={g.name}><i style={{ background: g.color }} />{g.name}</span>
          ))}
          <span><i className="ring done" />o'zlashtirilgan</span>
          <span><i className="ring ready" />o'qishga tayyor</span>
        </div>
        {s && (
          <div className="map-sel">
            <h3>{s.title}</h3>
            <div className="muted small">{s.ru} · {s.en}</div>
            <p>{s.idea}</p>
            {s.prereqs.length > 0 && (
              <ul>
                {s.prereqs.map((p) => (
                  <li key={p.id}><b>{byId[p.id].title}:</b> {p.why}</li>
                ))}
              </ul>
            )}
            <button className="btn" onClick={() => nav(`/dars/${s.id}`)}>Darsni ochish →</button>
          </div>
        )}
      </div>
      <div className="map-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.06 }}
          minZoom={0.4}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, n) => setSel(n.id === sel ? null : n.id)}
          onNodeDoubleClick={(_, n) => nav(`/dars/${n.id}`)}
          onPaneClick={() => setSel(null)}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="#2a2d35" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
