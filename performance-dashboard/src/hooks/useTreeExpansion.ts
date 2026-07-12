import { useCallback, useMemo, useState } from "react";
import { collectExpandableKeys } from "../lib/tree";
import type { SheetNode } from "../lib/types";

export interface TreeExpansion {
  expanded: Set<string>;
  toggle: (key: string) => void;
  toggleAll: () => void;
  allExpanded: boolean;
}

/** Controlled expand/collapse state for a HierarchyTree, plus a bulk expand-all/collapse-all toggle. */
export function useTreeExpansion(roots: SheetNode[]): TreeExpansion {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const allKeys = useMemo(() => collectExpandableKeys(roots), [roots]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const allExpanded =
    allKeys.length > 0 && allKeys.every((k) => expanded.has(k));

  const toggleAll = useCallback(() => {
    setExpanded(allExpanded ? new Set() : new Set(allKeys));
  }, [allExpanded, allKeys]);

  return { expanded, toggle, toggleAll, allExpanded };
}
