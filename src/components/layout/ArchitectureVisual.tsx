"use client";

import { useId, useState } from "react";

type NodeKey = "applications" | "apis" | "data" | "operations";
type Labels = {
  title: string;
  applications: string;
  apis: string;
  data: string;
  operations: string;
  caption: string;
  hint: string;
  descriptions: Record<NodeKey, string>;
};
const nodes: { key: NodeKey; x: number; y: number; path: string }[] = [
  { key: "applications", x: 122, y: 102, path: "M122 102H190V176L215 200" },
  { key: "apis", x: 398, y: 102, path: "M398 102H330V176L305 200" },
  { key: "data", x: 122, y: 348, path: "M122 348H190V274L215 250" },
  { key: "operations", x: 398, y: 348, path: "M398 348H330V274L305 250" },
];

/** Interactive explanation of our engineering scope, not a live dashboard. */
export function ArchitectureVisual({ labels }: { labels: Labels }) {
  const [active, setActive] = useState<NodeKey | null>(null);
  const id = useId();
  const detailId = `${id}-detail`;
  const clipId = `${id}-brand`;
  const coreId = `${id}-core`;

  return (
    <div className="architecture-visual" data-cine="panel">
      <div className="architecture-heading">
        <span className="architecture-mark" />{labels.title}
        <span className="architecture-index">{active ? `0${nodes.findIndex(n => n.key === active) + 1} / 04` : "01 — 04"}</span>
      </div>
      <div className="architecture-stage">
        <div className="energy-nucleus" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <svg viewBox="0 0 520 450" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id={coreId}><stop stopColor="#29354a"/><stop offset="1" stopColor="#101c2d"/></radialGradient>
            <clipPath id={clipId}><circle cx="260" cy="225" r="53"/></clipPath>
          </defs>
          <g fill="none" stroke="#26354a" strokeWidth="1">
            <circle cx="260" cy="225" r="155"/>
            <circle cx="260" cy="225" r="199" strokeDasharray="3 9"/>
            <path d="M260 15V435M30 225H490" strokeDasharray="3 9"/>
          </g>
          {nodes.map(node => <path key={node.key} d={node.path} className={`architecture-connection${active === node.key ? " architecture-connection--active" : ""}`} />)}
          <circle cx="260" cy="225" r="72" fill={`url(#${coreId})`} fillOpacity="0.2" stroke="#c3a16b" strokeWidth="1.2"/>
          <circle cx="260" cy="225" r="86" fill="none" stroke="#c3a16b" strokeOpacity={active ? .6 : .23}/>
          <image href="/images/perfil-512.webp" x="207" y="172" width="106" height="106" clipPath={`url(#${clipId})`}/>
        </svg>
        {nodes.map(node => (
          <button
            type="button"
            key={node.key}
            className={`architecture-node${active === node.key ? " architecture-node--active" : ""}`}
            style={{ left: `${node.x / 520 * 100}%`, top: `${node.y / 450 * 100}%` }}
            aria-pressed={active === node.key}
            aria-controls={detailId}
            aria-describedby={active === node.key ? detailId : undefined}
            onMouseEnter={() => setActive(node.key)}
            onFocus={() => setActive(node.key)}
            onClick={() => setActive(node.key)}
            onKeyDown={event => { if (event.key === "Escape") setActive(null); }}
          >
            <span className="architecture-node-dot" aria-hidden="true" />
            {labels[node.key]}
            <span className="architecture-node-arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="architecture-detail" id={detailId} aria-live="polite" aria-atomic="true">
        <div className="architecture-detail-title"><span>{active ? labels[active] : "FISAM TECH"}</span><span aria-hidden="true">{active ? "↗" : "+"}</span></div>
        <p>{active ? labels.descriptions[active] : labels.hint}</p>
      </div>
      <p className="visually-hidden">{labels.caption}</p>
    </div>
  );
}
