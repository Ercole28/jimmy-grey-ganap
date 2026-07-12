import type { SheetNode } from "./types";

export function findFirstByLabel(nodes: SheetNode[], match: RegExp): SheetNode | undefined {
  return findAllByLabel(nodes, match)[0];
}

export function findAllByLabel(nodes: SheetNode[], match: RegExp): SheetNode[] {
  const out: SheetNode[] = [];
  for (const n of nodes) {
    if (match.test(n.label)) out.push(n);
    out.push(...findAllByLabel(n.children, match));
  }
  return out;
}

export function findAllByCode(nodes: SheetNode[], code: string): SheetNode[] {
  const out: SheetNode[] = [];
  for (const n of nodes) {
    if (n.code === code) out.push(n);
    out.push(...findAllByCode(n.children, code));
  }
  return out;
}

export function flattenLeaves(nodes: SheetNode[]): SheetNode[] {
  const out: SheetNode[] = [];
  for (const n of nodes) {
    if (n.unit !== undefined) out.push(n);
    out.push(...flattenLeaves(n.children));
  }
  return out;
}

/**
 * Returns the ancestor chain [root, ..., immediateParent] for a target node
 * found by reference equality. Empty array if target is itself a root or
 * not found. Used to locate the "containing section" of a resolved KPI node
 * for share/dominance calculations.
 */
export function findAncestorChain(roots: SheetNode[], target: SheetNode): SheetNode[] {
  function search(nodes: SheetNode[], trail: SheetNode[]): SheetNode[] | null {
    for (const n of nodes) {
      if (n === target) return trail;
      const found = search(n.children, [...trail, n]);
      if (found) return found;
    }
    return null;
  }
  return search(roots, []) ?? [];
}
