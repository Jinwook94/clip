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

  // action 블록을 찾음 (childBlocks 중 type이 "action"인 블록)
  const actionBlock = childBlocks.find((b) => b.type === "action");

  const actionBlockName =
    actionBlock &&
    typeof actionBlock.properties.name === "string" &&
    actionBlock.properties.name.trim() !== ""
      ? actionBlock.properties.name
      : t("NO_NAME", "No Name");

  // --- 아래 부분 추가: requiredBlockTypes 계산 ---
  let requiredBlockTypes: string[] = [];
  if (actionBlock) {
    // action block에 설정된 requiredBlockTypes 값 (존재하지 않으면 빈 배열)
    requiredBlockTypes =
      (actionBlock.properties.requiredBlockTypes as string[]) ?? [];
  }
  // ---------------------------------------------------

  // clip 블록의 이름 처리
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
        {/* requiredBlockTypes 표시 */}
        {actionBlock && requiredBlockTypes.length > 0 && (
          <div className="flex items-center gap-1">
            {requiredBlockTypes.map((rType) => {
              const found = childBlocks.find((b) => b.type === rType);
              if (found) {
                const foundName =
                  typeof found.properties.name === "string" &&
                  found.properties.name.trim() !== ""
                    ? found.properties.name
                    : t("UNNAMED_BLOCK", "Unnamed Block");
                return (
                  <Tooltip key={rType} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-8 w-8 rounded bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center cursor-default"
                        role="button"
                        tabIndex={0}
                      >
                        ✓
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {`${rType}\n: ${foundName}`}
                    </TooltipContent>
                  </Tooltip>
                );
              } else {
                return (
                  <Tooltip key={rType} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-8 w-8 rounded bg-gray-100 text-gray-400 text-[10px] flex items-center justify-center cursor-default"
                        role="button"
                        tabIndex={0}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">{rType}</TooltipContent>
                  </Tooltip>
                );
              }
            })}
          </div>
        )}
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
          className="px-2 py-1 border rounded shadow text-sm relative"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit();
          }}
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
