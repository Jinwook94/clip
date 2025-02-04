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

interface BlockCardProps {
  block: BlockItem;
  onEditBlock: (block: BlockItem) => void;
  onDeleteBlock: (block: BlockItem) => void;
}

export default function BlockCard({
  block,
  onEditBlock,
  onDeleteBlock,
}: BlockCardProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // 수정: block.properties.color 관련 커스터마이징 기능 삭제하고, 기본 배경색 "#eee" 사용
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    backgroundColor: "#eee",
    cursor: isDragging ? "grabbing" : "pointer",
  };

  const displayName =
    typeof block.properties.name === "string" &&
    block.properties.name.trim() !== ""
      ? block.properties.name
      : t("NO_NAME", "No Name");

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
          // 클릭 시 편집 모달 호출
          onClick={(e) => {
            e.stopPropagation();
            handleEdit();
          }}
          className="px-2 py-1 border rounded shadow text-sm relative"
        >
          <div className="flex flex-col">
            <div className="text-xs text-gray-500">{block.type}</div>
            <div className="text-sm font-semibold">{displayName}</div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleEdit}>{t("EDIT")}</ContextMenuItem>
        <ContextMenuItem onSelect={handleDelete}>{t("DELETE")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
