import React, { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { IconPlayerPlay } from "@tabler/icons-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useBlockStore, BlockItem } from "@/store/blockStore";

interface ClipBlockCardProps {
  block: BlockItem;
  isOver?: boolean;
  onRunClip?: (clipId: string) => void;
  onEditBlock: (block: BlockItem) => void;
  onDeleteBlock: (block: BlockItem) => void;
}

export default function ClipBlockCard({
  block,
  isOver,
  onRunClip,
  onEditBlock,
  onDeleteBlock,
}: ClipBlockCardProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // 수정: block.properties.color 관련 커스터마이징 기능 삭제하고, 기본 배경색 "#ffffff" 사용
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    cursor: isDragging ? "grabbing" : "pointer",
    backgroundColor: isOver ? "#e2e8f0" : "#ffffff",
  };

  const allBlocks = useBlockStore((s) => s.blocks);
  const childBlocks = useMemo(
    () => allBlocks.filter((b) => block.content.includes(b.id)),
    [allBlocks, block.content],
  );

  const actionBlock = childBlocks.find((b) => b.type === "action");

  const actionBlockName = actionBlock
    ? typeof actionBlock.properties.name === "string" &&
      actionBlock.properties.name.trim() !== ""
      ? actionBlock.properties.name
      : t("NO_NAME", "No Name")
    : "";

  const clipName =
    typeof block.properties.name === "string" &&
    block.properties.name.trim() !== ""
      ? block.properties.name
      : t("UNTITLED", "Untitled");

  const handleRun = () => onRunClip?.(block.id);
  const handleEdit = () => onEditBlock(block);
  const handleDelete = () => onDeleteBlock(block);

  function renderSlotsRow() {
    const hasAction = !!actionBlock;
    const actionSlotClass = hasAction
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-400";

    return (
      <div className="flex items-center gap-2">
        {onRunClip && block.type === "clip" && (
          <Button
            variant="ghost"
            size="sm"
            draggable={false}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleRun();
            }}
            className="h-8 px-2 flex items-center"
          >
            <IconPlayerPlay className="w-4 h-4" />
          </Button>
        )}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div
              className={`h-8 px-3 rounded flex items-center justify-center text-xs cursor-default ${actionSlotClass}`}
              role="button"
              tabIndex={0}
            >
              {actionBlockName}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            {actionBlock
              ? `${(actionBlock.properties.actionType as string) || "copy"}`
              : "Empty action slot"}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          // 클릭 시 편집 모달 열기
          onClick={(e) => {
            e.stopPropagation();
            handleEdit();
          }}
          className="px-2 py-1 border rounded shadow text-sm relative"
        >
          <div className="text-sm font-semibold mb-2">{clipName}</div>
          {renderSlotsRow()}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{t("CLIP")}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleEdit}>{t("EDIT")}</ContextMenuItem>
        <ContextMenuItem onSelect={handleDelete}>{t("DELETE")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
