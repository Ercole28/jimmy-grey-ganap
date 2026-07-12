import { Fragment, useState } from "react";
import { MONTH_NAMES_SHORT } from "../lib/months";
import { formatValue } from "../lib/months";
import type { SheetNode } from "../lib/types";

interface HierarchyTreeProps {
  roots: SheetNode[];
}

function nodeKey(path: number[]): string {
  return path.join("-");
}

// Highlight only true grand-total rows ("Jumlah kunjungan kapal"), not the
// per-branch subtotals feeding into them ("Jumlah kunjungan kapal di DERMAGA
// UMUM") — otherwise nearly every row at the default collapse depth ends up
// highlighted, since those subtotals are what's visible before drilling in.
const GRAND_TOTAL_RE = /^Jumlah\b(?!.*\bdi\b)/i;

function TreeRows({
  nodes,
  path,
  depth,
  expanded,
  onToggle,
}: {
  nodes: SheetNode[];
  path: number[];
  depth: number;
  expanded: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <>
      {nodes.map((node, i) => {
        const childPath = [...path, i];
        const key = nodeKey(childPath);
        const isLeaf = node.unit !== undefined;
        const hasChildren = node.children.length > 0;
        const isExpanded = expanded.has(key);
        const rowClass = !isLeaf ? "tt" : GRAND_TOTAL_RE.test(node.label) ? "hl" : undefined;

        return (
          <Fragment key={key}>
            <tr className={rowClass}>
              <td className="tree-cell" style={{ paddingLeft: 12 + depth * 18 }}>
                {hasChildren ? (
                  <button type="button" className="tree-cell__toggle" onClick={() => onToggle(key)}>
                    <span className="tree-cell__caret">{isExpanded ? "▾" : "▸"}</span>
                    {node.label}
                  </button>
                ) : (
                  node.label
                )}
              </td>
              <td className="tree-cell__unit">{node.unit ?? ""}</td>
              {isLeaf
                ? node.months.map((v, mi) => <td key={mi}>{formatValue(v)}</td>)
                : MONTH_NAMES_SHORT.map((_, mi) => <td key={mi} />)}
              <td>{isLeaf ? formatValue(node.total) : ""}</td>
            </tr>
            {hasChildren && isExpanded && (
              <TreeRows nodes={node.children} path={childPath} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export function HierarchyTree({ roots }: HierarchyTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(roots.map((_, i) => nodeKey([i]))));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <table className="t">
      <thead>
        <tr>
          <th>Uraian</th>
          <th>Satuan</th>
          {MONTH_NAMES_SHORT.map((m) => (
            <th key={m}>{m}</th>
          ))}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <TreeRows nodes={roots} path={[]} depth={0} expanded={expanded} onToggle={toggle} />
      </tbody>
    </table>
  );
}
