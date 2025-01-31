import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { IconMenu2, IconPlus } from "@tabler/icons-react";
import { useBlockStore, BlockItem } from "@/store/blockStore";
import { ensureClipRunDoneListener } from "@/lib/ipcRendererOnce";
import BlockCreateModal from "@/components/BlockCreateModal";

import BlockCard from "./BlockCard";
import EndBlockAdder from "./EndBlockAdder";
import ClipBlockCard from "./ClipBlockCard";
import DragOverlayBlock from "@/components/clips/DragOverlayBlock";

interface ClipHomeProps {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}

const PLACEHOLDER_ID = "__end__";

export default function ClipHome({
  isSidebarOpen,
  onOpenSidebar,
}: ClipHomeProps) {
  const { t } = useTranslation();
  const { blocks, loadBlocksFromDB, updateBlock, deleteBlock, runBlock } =
    useBlockStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockItem | null>(null);

  // 최근 생성된 블록타입을 추적. 없으면 "project_root" 기본
  const [lastCreatedType, setLastCreatedType] =
    useState<string>("project_root");

  // DnD 상태
  const [activeBlock, setActiveBlock] = useState<BlockItem | null>(null);
  const [, setOverId] = useState<string | null>(null);

  useEffect(() => {
    loadBlocksFromDB();
    ensureClipRunDoneListener();
  }, [loadBlocksFromDB]);

  /**
   * BlockCreateModal에서 새 블록 생성이 완료됐을 때,
   * 해당 블록의 type을 lastCreatedType으로 갱신하기 위해 사용할 콜백
   */
  const handleBlockCreated = (newType: string) => {
    setLastCreatedType(newType);
  };

  function getSort(block: BlockItem) {
    return typeof block.properties.sortOrder === "number"
      ? (block.properties.sortOrder as number)
      : 9999;
  }

  // clip 타입들
  const clipBlocks = blocks
    .filter((b) => b.type === "clip")
    .sort((a, b) => getSort(a) - getSort(b));

  // 그 외 block 들
  const rawBlocks = blocks
    .filter((b) => b.type !== "clip")
    .sort((a, b) => getSort(a) - getSort(b));

  // placeholder block
  const placeholderBlock: BlockItem = {
    id: PLACEHOLDER_ID,
    type: "placeholder",
    properties: {},
    content: [],
    parent: null,
  };
  const extendedBlocks = [...rawBlocks, placeholderBlock];

  // DnD 세팅
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = String(event.active.id);
    const found = blocks.find((b) => b.id === draggedId) || null;
    setActiveBlock(found);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const newOverId = event.over?.id ? String(event.over.id) : null;
    setOverId(newOverId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBlock(null);
    setOverId(null);

    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const overBlockId = String(over.id);

    // 1) clip 블록 위 드롭
    if (overBlockId.startsWith("clip-")) {
      const clipId = overBlockId.replace("clip-", "");
      if (clipId === draggedId) return;
      const clipBlock = blocks.find((b) => b.id === clipId);
      if (!clipBlock) return;

      if (!clipBlock.content.includes(draggedId)) {
        const newContent = [...clipBlock.content, draggedId];
        await updateBlock(clipBlock.id, { content: newContent });
      }
      return;
    }

    // 2) 블록들 재정렬
    const blockArr = rawBlocks;
    const oldIndex = blockArr.findIndex((b) => b.id === draggedId);
    if (oldIndex < 0) return;

    let newIndex: number;
    if (overBlockId === PLACEHOLDER_ID) {
      newIndex = blockArr.length;
    } else {
      const foundIndex = blockArr.findIndex((b) => b.id === overBlockId);
      if (foundIndex < 0) return;
      newIndex = foundIndex;
    }

    const reordered = arrayMove(blockArr, oldIndex, newIndex);
    for (let i = 0; i < reordered.length; i++) {
      const item = reordered[i];
      await updateBlock(item.id, { properties: { sortOrder: i } });
    }
  };

  // -- 핸들러들 --
  const handleRunClip = (clipId: string) => {
    runBlock(clipId);
  };
  const handleEditBlock = (block: BlockItem) => {
    setEditingBlock(block);
    setModalOpen(true);
  };
  const handleDeleteBlock = (block: BlockItem) => {
    if (window.confirm(t("DELETE_CONFIRM") || "정말 삭제하시겠습니까?")) {
      deleteBlock(block.id);
    }
  };

  /**
   * end block의 + 버튼 클릭 → 새 블록 만들기
   *  - lastCreatedType (없으면 project_root) 를 기본으로
   */
  const handleAddBlockAtEnd = () => {
    setEditingBlock(null);
    setModalOpen(true);
  };

  return (
    <>
      {/* 새/편집 Block 모달 */}
      <BlockCreateModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBlock(null);
        }}
        editingBlock={editingBlock ?? undefined}
        onBlockCreated={handleBlockCreated}
        defaultType={lastCreatedType}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* 상단바 */}
        <div className="flex items-center justify-between mb-4">
          {!isSidebarOpen && (
            <Button variant="ghost" onClick={onOpenSidebar}>
              <IconMenu2 className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold">{t("MY_CLIPS")}</h1>
          <Button
            variant="outline"
            onClick={() => {
              setEditingBlock(null);
              setModalOpen(true);
            }}
          >
            <IconPlus className="w-5 h-5" />
          </Button>
        </div>

        {/* clip blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {clipBlocks.map((block) => (
            <ClipBlockCard
              key={block.id}
              block={block}
              onRunClip={handleRunClip}
              onEditBlock={handleEditBlock}
              onDeleteBlock={handleDeleteBlock}
            />
          ))}
        </div>

        <hr className="my-4" />
        <h2 className="font-bold mb-2">{t("BLOCKS")}</h2>

        <SortableContext
          items={extendedBlocks.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {extendedBlocks.map((block) => {
              if (block.id === PLACEHOLDER_ID) {
                // "마지막 뒤" 영역
                return (
                  <EndBlockAdder
                    key={PLACEHOLDER_ID}
                    onAddBlock={handleAddBlockAtEnd}
                  />
                );
              }
              return (
                <BlockCard
                  key={block.id}
                  block={block}
                  onEditBlock={handleEditBlock}
                  onDeleteBlock={handleDeleteBlock}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeBlock && <DragOverlayBlock block={activeBlock} />}
        </DragOverlay>
      </DndContext>
    </>
  );
}
