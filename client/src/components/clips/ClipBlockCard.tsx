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

/**
 * ClipBlockCard 컴포넌트는 개별 clip 블록을 카드 형태로 보여줍니다.
 * 내부에는 드래그/드롭을 위한 UI와 함께,
 * - 상단에 클립 블록의 이름(이름이 없으면 "Untitled")을 강조하여 표시하고,
 * - 액션 블록의 슬롯에서는 해당 블록의 name이 비어있다면 "Unnamed Action Block" (혹은 번역된 메시지)
 *   또는 다른 블록의 경우 "Unnamed Block"으로 표시하여, 이름이 정해지지 않았음을 명확히 전달합니다.
 */
export default function ClipBlockCard({
  block,
  isOver,
  onRunClip,
  onEditBlock,
  onDeleteBlock,
}: ClipBlockCardProps) {
  const { t } = useTranslation();

  // 드래그/드롭 관련 속성 획득 (useSortable)
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
    cursor: isDragging ? "grabbing" : "grab",
    backgroundColor: isOver
      ? "#e2e8f0"
      : (block.properties.color as string) || "#ffffff",
  };

  // 전체 블록 상태에서 현재 블록의 자식 블록들(연결된 블록들)을 필터링
  const allBlocks = useBlockStore((s) => s.blocks);
  const childBlocks = useMemo(
    () => allBlocks.filter((b) => block.content.includes(b.id)),
    [allBlocks, block.content],
  );

  // action 블록을 찾음 (childBlocks 중 type이 "action"인 블록)
  const actionBlock = childBlocks.find((b) => b.type === "action");

  const actionBlockName = actionBlock
    ? typeof actionBlock.properties.name === "string" &&
      actionBlock.properties.name.trim() !== ""
      ? actionBlock.properties.name
      : t("NO_NAME", "No Name")
    : "";

  // 필요한 requiredBlockTypes 계산 (action 블록이 있으면)
  let requiredBlockTypes: string[] = [];
  if (actionBlock) {
    requiredBlockTypes =
      (actionBlock.properties.requiredBlockTypes as string[]) ?? [];
    const actionType = (actionBlock.properties.actionType as string) || "copy";
    if (requiredBlockTypes.length === 0 && actionType === "copy") {
      requiredBlockTypes = ["project_root", "selected_path"];
    }
  }

  // clip 블록의 이름 처리:
  // - block.properties.name이 유효하면 사용하고, 그렇지 않으면 다국어 번역 키 "UNTITLED"를 사용
  const clipName =
    typeof block.properties.name === "string" &&
    block.properties.name.trim() !== ""
      ? block.properties.name
      : t("UNTITLED", "Untitled");

  // 실행, 편집, 삭제 핸들러 정의
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
        {/* (1) 실행 버튼: clip 타입일 때만 표시 */}
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

        {/* (2) 액션 슬롯: action 블록의 이름을 표시 */}
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

        {/* (3) requiredBlockTypes 표시 */}
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
        >
          {/* 상단에는 클립의 이름을 강조해서 표시 */}
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
