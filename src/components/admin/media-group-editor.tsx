"use client";

import { useState, useTransition } from "react";
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MediaPicker } from "./media-picker";
import { IconPlus, IconClose } from "./icons";
import { addItems, removeItem, reorderItems } from "@/app/admin/media/groups/actions";

type Item = {
  id: string;
  path: string;
  alt: string;
  caption: string | null;
  sortOrder: number;
};

export function MediaGroupEditor({
  group,
}: {
  group: { id: string; slug: string; name: string; items: Item[] };
}) {
  const [items, setItems] = useState(group.items);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const embed = `::gallery[${group.slug}]::`;

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(embed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next);
    startTransition(async () => {
      try {
        await reorderItems(group.id, next.map((i) => i.id));
      } catch {
        setItems(previous);
      }
    });
  }

  function handlePick(
    payload:
      | { kind: "image"; url: string; alt: string }
      | { kind: "gallery"; slug: string; insert: string },
  ) {
    if (payload.kind !== "image") return;
    const url = payload.url;
    const fd = new FormData();
    fd.set("paths", JSON.stringify([url]));
    startTransition(async () => {
      const added = await addItems(group.id, fd);
      setItems((previous) => [...previous, ...added]);
      setPickerOpen(false);
    });
  }

  async function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeItem(itemId);
      setItems((previous) => previous.filter((item) => item.id !== itemId));
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Bilder ({items.length})</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Einbetten:</span>
          <code className="bg-brand-soft border border-border rounded px-2 py-1 font-mono">
            {embed}
          </code>
          <button
            type="button"
            onClick={copyEmbed}
            className="rounded-md border border-border px-3 py-1 hover:bg-brand-soft"
          >
            {copied ? "Kopiert ✓" : "Kopieren"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand text-white px-4 py-1.5 text-sm font-medium hover:bg-brand-dark"
        >
          <IconPlus width={14} height={14} />
          Bild hinzufügen
        </button>
        {pending ? (
          <span className="text-xs text-muted italic">speichert…</span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-muted text-sm">Noch keine Bilder.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
              {items.map((item) => (
                <ItemTile
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
        showGroups={false}
      />
    </section>
  );
}

function ItemTile({
  item,
  onRemove,
}: {
  item: Item;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="relative group">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="block w-full border border-border rounded-md overflow-hidden bg-background cursor-grab active:cursor-grabbing"
        aria-label="Zum Verschieben ziehen"
      >
        <div className="aspect-[4/3] bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.path}
            alt={item.alt}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="px-2 py-1 text-xs font-mono text-muted truncate">
          {item.path.split("/").pop()}
        </div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Entfernen"
        className="absolute top-1 right-1 bg-white/90 border border-border rounded-md p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition"
      >
        <IconClose width={12} height={12} />
      </button>
    </li>
  );
}
