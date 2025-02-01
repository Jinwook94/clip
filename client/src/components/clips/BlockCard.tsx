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

/**
 * BlockCardProps 타입은 개별 블록 데이터를 전달받으며,
 * 블록 편집 및 삭제를 위한 핸들러를 포함합니다.
 */
interface BlockCardProps {
  block: BlockItem;
  onEditBlock: (block: BlockItem) => void;
  onDeleteBlock: (block: BlockItem) => void;
}

/**
 * BlockCard 컴포넌트는 개별 블록을 카드 형식으로 보여줍니다.
 * 카드 내에는 두 개의 텍스트가 수직으로 정렬되어 있습니다.
 * - 상단: 블록의 타입을 작고 연하게 표시하여, 사용자가 자연스럽게 블록의 범주를 인식할 수 있도록 함.
 * - 하단: 블록의 이름을 강조해서 표시
 */
export default function BlockCard({
  block,
  onEditBlock,
  onDeleteBlock,
}: BlockCardProps) {
  const { t } = useTranslation();

  // useSortable 훅을 사용하여 드래그/드롭 관련 속성을 가져옴
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // 드래그 중인 경우의 스타일 및 기본 스타일을 정의
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    backgroundColor: (block.properties.color as string) ?? "#eee",
    cursor: isDragging ? "grabbing" : "grab",
  };

  const displayName =
    typeof block.properties.name === "string" &&
    block.properties.name.trim() !== ""
      ? block.properties.name
      : t("NO_NAME", "No Name");

  // 편집 버튼 클릭 핸들러
  const handleEdit = () => {
    onEditBlock(block);
  };

  // 삭제 버튼 클릭 핸들러
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
          {/* 블록 타입과 이름을 수직으로 정렬하여 표시 */}
          <div className="flex flex-col">
            {/* 블록 타입(label)을 작고 연한 회색 텍스트로 자연스럽게 표시 */}
            <div className="text-xs text-gray-500">{block.type}</div>
            <div className="text-sm font-semibold">{displayName}</div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {/* 편집 및 삭제 메뉴 항목 (다국어 처리) */}
        <ContextMenuItem onSelect={handleEdit}>{t("EDIT")}</ContextMenuItem>
        <ContextMenuItem onSelect={handleDelete}>{t("DELETE")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
