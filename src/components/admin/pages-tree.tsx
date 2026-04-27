"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import {
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconList,
} from "./icons";
import { reorderSiblings } from "@/app/admin/pages/actions";

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div
        aria-hidden
        className="shrink-0 w-16 h-11 bg-zinc-100 border border-border rounded-sm flex items-center justify-center text-muted text-xs"
      >
        —
      </div>
    );
  }
  const isSvg = src.toLowerCase().endsWith(".svg");
  return (
    <div className="shrink-0 w-16 h-11 relative overflow-hidden border border-border rounded-sm bg-zinc-100">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="64px"
        className="object-cover"
        unoptimized={isSvg}
      />
    </div>
  );
}

export type PageTreeItem = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  sortOrder: number;
  firstImage: string | null;
};

type Node = {
  segment: string;
  fullPath: string;
  page: PageTreeItem | null;
  children: Node[];
};

function buildTree(pages: PageTreeItem[]): Node[] {
  const byPath = new Map<string, Node>();
  const ensure = (fullPath: string): Node => {
    let n = byPath.get(fullPath);
    if (n) return n;
    const segs = fullPath.split("/");
    n = {
      segment: segs[segs.length - 1] || "",
      fullPath,
      page: null,
      children: [],
    };
    byPath.set(fullPath, n);
    if (segs.length > 1) {
      const parent = ensure(segs.slice(0, -1).join("/"));
      parent.children.push(n);
    }
    return n;
  };
  for (const p of pages) ensure(p.slug).page = p;
  const roots: Node[] = [];
  for (const [path, node] of byPath) {
    if (!path.includes("/")) roots.push(node);
  }
  const sortRec = (list: Node[]) => {
    list.sort((a, b) => {
      const ao = a.page?.sortOrder ?? 0;
      const bo = b.page?.sortOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.page?.title ?? a.segment).localeCompare(
        b.page?.title ?? b.segment,
      );
    });
    for (const c of list) sortRec(c.children);
  };
  sortRec(roots);
  return roots;
}

function allFolderPaths(roots: Node[]): string[] {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (n.children.length > 0) out.push(n.fullPath);
    for (const c of n.children) walk(c);
  };
  for (const r of roots) walk(r);
  return out;
}

const EXPAND_KEY = "admin-pages-expanded";

export function PagesTree({ pages }: { pages: PageTreeItem[] }) {
  const [roots, setRoots] = useState<Node[]>(() => buildTree(pages));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [pending, startTransition] = useTransition();

  // Re-build tree when parent re-renders with new pages prop.
  useEffect(() => {
    setRoots(buildTree(pages));
  }, [pages]);

  // Hydrate expand state from localStorage; default to all expanded.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXPAND_KEY);
      if (raw) {
        setExpanded(new Set(JSON.parse(raw) as string[]));
      } else {
        setExpanded(new Set(allFolderPaths(roots)));
      }
    } catch {
      setExpanded(new Set(allFolderPaths(roots)));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(EXPAND_KEY, JSON.stringify(Array.from(expanded)));
    } catch {}
  }, [expanded, hydrated]);

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () =>
    setExpanded(new Set(allFolderPaths(roots)));
  const collapseAll = () => setExpanded(new Set());

  function reorderInPlace(parentPath: string, fromId: string, toId: string) {
    let changed = false;
    let newIds: string[] = [];
    const walk = (list: Node[], parent: string): Node[] => {
      if (parent === parentPath) {
        const ids = list.map((n) => n.page?.id ?? `virt:${n.fullPath}`);
        const fromIdx = ids.indexOf(fromId);
        const toIdx = ids.indexOf(toId);
        if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return list;
        const reordered = arrayMove(list, fromIdx, toIdx);
        changed = true;
        newIds = reordered
          .map((n) => n.page?.id)
          .filter((x): x is string => !!x);
        return reordered;
      }
      return list.map((n) => ({
        ...n,
        children: walk(n.children, n.fullPath),
      }));
    };
    setRoots((prev) => walk(prev, ""));
    return { changed, newIds };
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm">
        <button
          type="button"
          onClick={expandAll}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 hover:bg-brand-soft"
        >
          <IconList width={12} height={12} />
          Alle aufklappen
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="rounded-md border border-border px-2.5 py-1 hover:bg-brand-soft"
        >
          Alle zuklappen
        </button>
        {pending ? (
          <span className="text-xs text-muted italic">speichere Reihenfolge…</span>
        ) : null}
      </div>
      <ul className="border border-border rounded-md overflow-hidden bg-surface divide-y divide-border">
        <Level
          parentPath=""
          nodes={roots}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          onReorder={(parentPath, fromId, toId) => {
            const { changed, newIds } = reorderInPlace(parentPath, fromId, toId);
            if (changed && newIds.length > 1) {
              startTransition(async () => {
                await reorderSiblings(newIds);
              });
            }
          }}
        />
      </ul>
    </div>
  );
}

function Level({
  parentPath,
  nodes,
  depth,
  expanded,
  onToggle,
  onReorder,
}: {
  parentPath: string;
  nodes: Node[];
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onReorder: (parentPath: string, fromId: string, toId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = useMemo(
    () => nodes.map((n) => n.page?.id ?? `virt:${n.fullPath}`),
    [nodes],
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onReorder(parentPath, String(active.id), String(over.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {nodes.map((node) => (
          <Row
            key={node.page?.id ?? `virt:${node.fullPath}`}
            node={node}
            depth={depth}
            expanded={expanded}
            onToggle={onToggle}
            onReorder={onReorder}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function Row({
  node,
  depth,
  expanded,
  onToggle,
  onReorder,
}: {
  node: Node;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onReorder: (parentPath: string, fromId: string, toId: string) => void;
}) {
  const sortId = node.page?.id ?? `virt:${node.fullPath}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId, disabled: !node.page });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };

  const isVirtual = node.page === null;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.fullPath);
  const indent = depth * 20;

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 px-3 py-2 bg-surface"
      >
        <div style={{ width: indent }} className="shrink-0" aria-hidden />

        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.fullPath)}
            aria-label={isOpen ? "Einklappen" : "Ausklappen"}
            aria-expanded={isOpen}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-brand-soft"
          >
            {isOpen ? (
              <IconChevronDown width={14} height={14} />
            ) : (
              <IconChevronRight width={14} height={14} />
            )}
          </button>
        ) : (
          <span className="shrink-0 w-6 h-6" aria-hidden />
        )}

        {/* Drag handle */}
        {isVirtual ? (
          <span
            className="shrink-0 w-6 h-6 flex items-center justify-center text-muted"
            aria-hidden
          >
            <IconFolder width={14} height={14} />
          </span>
        ) : (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Verschieben: ${node.page!.title}`}
            className="shrink-0 w-6 h-6 flex items-center justify-center text-muted hover:text-brand-dark cursor-grab active:cursor-grabbing"
            title="Zum Verschieben ziehen"
          >
            <DragIcon />
          </button>
        )}

        {isVirtual ? (
          <div className="shrink-0 w-16 h-11 flex items-center justify-center text-muted">
            <IconFolder />
          </div>
        ) : (
          <Thumb src={node.page!.firstImage} alt={node.page!.title} />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {isVirtual ? (
              <span className="text-muted italic">
                {node.segment}{" "}
                <span className="text-xs">(keine Seite)</span>
              </span>
            ) : (
              node.page!.title
            )}
          </div>
          <div className="text-xs text-muted font-mono truncate">
            /{node.fullPath}
            {hasChildren ? (
              <span className="ml-2 text-[0.65rem] uppercase tracking-wider text-muted">
                {node.children.length} Unterseiten
              </span>
            ) : null}
          </div>
        </div>

        {node.page ? (
          <>
            <span
              className={`shrink-0 text-xs rounded-full px-2 py-0.5 border ${
                node.page.published
                  ? "text-green-800 border-green-300 bg-green-50"
                  : "text-amber-900 border-amber-300 bg-amber-50"
              }`}
            >
              {node.page.published ? "veröffentlicht" : "Entwurf"}
            </span>
            <Link
              href={`/admin/pages/new?parent=${encodeURIComponent(node.fullPath)}`}
              className="shrink-0 text-xs text-muted hover:text-brand-dark"
              title="Unterseite anlegen"
            >
              + Unterseite
            </Link>
            <Link
              href={`/admin/pages/${node.page.id}`}
              className="shrink-0 text-sm text-brand-dark hover:underline"
            >
              Bearbeiten
            </Link>
          </>
        ) : (
          <Link
            href={`/admin/pages/new?parent=${encodeURIComponent(node.fullPath)}`}
            className="shrink-0 text-xs text-brand-dark hover:underline"
            title="Seite in dieser Gruppe anlegen"
          >
            + Seite hier
          </Link>
        )}
      </li>
      {hasChildren && isOpen ? (
        <Level
          parentPath={node.fullPath}
          nodes={node.children}
          depth={depth + 1}
          expanded={expanded}
          onToggle={onToggle}
          onReorder={onReorder}
        />
      ) : null}
    </>
  );
}

function DragIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="currentColor"
      aria-hidden
    >
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}
