// file: client/src/components/clips/SortableOtherBlock.tsx

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import type { BlockItem } from "@/store/blockStore";

interface SortableOtherBlockProps {
  block: BlockItem;
  // isOver: boolean;  // ← 제거
  onEditBlock: (block: BlockItem) => void;
  onDeleteBlock: (block: BlockItem) => void;
}

export default function SortableOtherBlock({
  block,
  // isOver, // ← 제거
  onEditBlock,
  onDeleteBlock,
}: SortableOtherBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    backgroundColor: (block.properties.color as string) ?? "#eee",
    cursor: isDragging ? "grabbing" : "grab",
    // outline: isOver ? "2px dashed #3399ff" : "none",  // ← 제거
    // outlineOffset: isOver ? "-4px" : 0,               // ← 제거
  };

  const blockName =
    typeof block.properties.name === "string"
      ? block.properties.name
      : block.type;

  const handleEdit = () => {
    onEditBlock(block);
  };

  const handleDelete = () => {
    onDeleteBlock(block);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="px-2 py-1 border rounded shadow text-sm relative"
        >
          {blockName} ({block.id.slice(0, 6)})
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={handleEdit}>Edit</ContextMenuItem>
        <ContextMenuItem onSelect={handleDelete}>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
