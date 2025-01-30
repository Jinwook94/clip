import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { IconPlayerPlay } from "@tabler/icons-react";
import type { BlockItem } from "@/store/blockStore";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useTranslation } from "react-i18next";

interface BlockCardProps {
  block: BlockItem;
  onRunClip?: (clipId: string) => void;
  onEditBlock: (block: BlockItem) => void;
  onDeleteBlock: (block: BlockItem) => void;
}

export default function BlockCard({
  block,
  onRunClip,
  onEditBlock,
  onDeleteBlock,
}: BlockCardProps) {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({ id: `clip-${block.id}` });

  const blockName =
    typeof block.properties.name === "string"
      ? block.properties.name
      : `Untitled ${block.type}`;

  // clip 실행 콜백
  const handleRun = () => {
    if (!onRunClip) return;
    onRunClip(block.id);
  };

  // edit
  const handleEdit = () => {
    onEditBlock(block);
  };

  // delete
  const handleDelete = () => {
    onDeleteBlock(block);
  };

  return (
    // ContextMenu:
    //  우클릭 (or 컨텍스트메뉴 트리거) 시 <ContextMenuContent> 가 표시됨
    <ContextMenu>
      {/* 우클릭 트리거로 Card 전체를 감쌈 */}
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          className={`border rounded p-2 ${
            isOver ? "bg-yellow-100" : "bg-white"
          }`}
          style={{
            backgroundColor: (block.properties.color as string) || undefined,
            cursor: "grab",
          }}
        >
          {/* 상단 영역: 이름 / 실행버튼 */}
          <div className="flex justify-between items-center mb-2">
            <div>
              <strong>{blockName}</strong> <span>({block.id.slice(0, 6)})</span>
            </div>
            {/* clip 타입일 때만 Run 아이콘 표시 */}
            {onRunClip && block.type === "clip" && (
              <Button variant="ghost" size="sm" onClick={handleRun}>
                <IconPlayerPlay className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-600">
            {t("CONTENT_CHILDREN_COUNT", { count: block.content.length })}
          </div>
        </div>
      </ContextMenuTrigger>

      {/* 실제 ContextMenu 내용 */}
      <ContextMenuContent>
        <ContextMenuLabel>{t("ACTIONS_LABEL")}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleEdit}>{t("EDIT")}</ContextMenuItem>
        <ContextMenuItem onSelect={handleDelete}>{t("DELETE")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
