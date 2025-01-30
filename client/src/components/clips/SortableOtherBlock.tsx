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
import { useTranslation } from "react-i18next";

interface SortableOtherBlockProps {
  block: BlockItem;
  onEditBlock: (block: BlockItem) => void;
  onDeleteBlock: (block: BlockItem) => void;
}

export default function SortableOtherBlock({
  block,
  onEditBlock,
  onDeleteBlock,
}: SortableOtherBlockProps) {
  const { t } = useTranslation();
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
        {/* Edit / Delete 부분 → i18n */}
        <ContextMenuItem onSelect={handleEdit}>{t("EDIT")}</ContextMenuItem>
        <ContextMenuItem onSelect={handleDelete}>{t("DELETE")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
