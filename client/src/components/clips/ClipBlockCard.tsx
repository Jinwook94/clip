import React, { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
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
  onRunClip?: (clipId: string) => void;
  onEditBlock: (block: BlockItem) => void;
  onDeleteBlock: (block: BlockItem) => void;
}

export default function ClipBlockCard({
  block,
  onRunClip,
  onEditBlock,
  onDeleteBlock,
}: ClipBlockCardProps) {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({ id: `clip-${block.id}` });

  const allBlocks = useBlockStore((s) => s.blocks);

  const childBlocks = useMemo(() => {
    return allBlocks.filter((b) => block.content.includes(b.id));
  }, [allBlocks, block.content]);

  // action 블록(최대 1개)
  const actionBlock = childBlocks.find((b) => b.type === "action");
  const actionBlockName = actionBlock
    ? (actionBlock.properties.name as string) || "(No name)"
    : "";

  // actionBlock 이 있으면 requiredBlockTypes 계산
  let requiredBlockTypes: string[] = [];
  if (actionBlock) {
    requiredBlockTypes =
      (actionBlock.properties.requiredBlockTypes as string[]) ?? [];
    const actionType = (actionBlock.properties.actionType as string) || "copy";
    if (requiredBlockTypes.length === 0 && actionType === "copy") {
      requiredBlockTypes = ["project_root", "selected_path"];
    }
  }

  // 블록 이름
  const clipName =
    typeof block.properties.name === "string"
      ? block.properties.name
      : t("UNTITLED") || "Untitled";

  // 실행 버튼 콜백
  const handleRun = () => {
    if (onRunClip && block.type === "clip") {
      onRunClip(block.id);
    }
  };

  // 편집 / 삭제 콜백
  const handleEdit = () => onEditBlock(block);
  const handleDelete = () => onDeleteBlock(block);

  function renderSlotsRow() {
    const hasAction = !!actionBlock;
    const actionSlotClass = hasAction
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-400";

    return (
      <div className="flex items-center gap-2">
        {/* Run 버튼을 slot들과 나란히 배치 */}
        {onRunClip && block.type === "clip" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            className="h-8 px-2 flex items-center"
          >
            <IconPlayerPlay className="w-4 h-4" />
          </Button>
        )}

        {/* Action slot */}
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

        {/* Required block slots */}
        {actionBlock && requiredBlockTypes.length > 0 && (
          <div className="flex items-center gap-1">
            {requiredBlockTypes.map((rType) => {
              const found = childBlocks.find((b) => b.type === rType);
              if (found) {
                const foundName =
                  typeof found.properties.name === "string"
                    ? found.properties.name
                    : rType;
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
                      ></div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{`${rType}`}</TooltipContent>
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
          className={`relative border rounded p-3 shadow-sm ${
            isOver ? "bg-yellow-100" : "bg-white"
          }`}
          style={{
            backgroundColor: (block.properties.color as string) || undefined,
          }}
        >
          {/* 클립 이름 */}
          <div className="text-sm font-semibold mb-2">{clipName}</div>

          {renderSlotsRow()}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuLabel>{t("ACTIONS_LABEL")}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleEdit}>{t("EDIT")}</ContextMenuItem>
        <ContextMenuItem onSelect={handleDelete}>{t("DELETE")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
