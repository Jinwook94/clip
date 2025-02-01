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
import DragOverlayBlock from "./DragOverlayBlock";

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
   * 해당 블록의 type을 lastCreatedType으로 갱신하기 위해
   */
  const handleBlockCreated = (newType: string) => {
    setLastCreatedType(newType);
  };

  function getSort(block: BlockItem) {
    return typeof block.properties.sortOrder === "number"
      ? (block.properties.sortOrder as number)
      : 9999;
  }

  // clip 타입들 (상단에 표시)
  const clipBlocks = blocks
    .filter((b) => b.type === "clip")
    .sort((a, b) => getSort(a) - getSort(b));

  // 그 외 block 들 (하단에 표시)
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

  /**
   * 드래그가 끝났을 때의 로직
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBlock(null);
    setOverId(null);

    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return; // 같은 위치

    const draggedBlock = blocks.find((b) => b.id === draggedId);
    if (!draggedBlock) return;

    /**
     * (1) clip 블록인 경우 → clipBlocks 재정렬
     *  - clip 블록을 다른 clip 블록 위치에 드롭 → 순서 변경
     *  - clip 블록을 raw blocks 영역, placeholder 등 위에 드롭 → 현재 예시 코드에서는 무시
     *    (원한다면 분기 처리 가능)
     */
    if (draggedBlock.type === "clip") {
      const oldIndex = clipBlocks.findIndex((b) => b.id === draggedId);
      if (oldIndex < 0) return;
      const newIndex = clipBlocks.findIndex((b) => b.id === overId);
      if (newIndex < 0) return; // clip이 아닌 대상 위라면 재정렬 무시

      // arrayMove 후 DB에 sortOrder 업데이트
      const reordered = arrayMove(clipBlocks, oldIndex, newIndex);
      for (let i = 0; i < reordered.length; i++) {
        await updateBlock(reordered[i].id, { properties: { sortOrder: i } });
      }
      return;
    }

    /**
     * (2) non-clip 블록인 경우
     *   - clip 블록 위에 드롭 → clipBlock.content 에 자식으로 등록
     *   - 그렇지 않으면 raw 블록 내에서 재정렬
     */
    if (draggedBlock.type !== "clip") {
      // over가 clip인지 여부 체크
      const isOverClip = clipBlocks.some((cb) => cb.id === overId);

      if (isOverClip) {
        // 자식 등록
        const targetClip = blocks.find((b) => b.id === overId);
        if (!targetClip) return;

        if (!targetClip.content.includes(draggedId)) {
          const newContent = [...targetClip.content, draggedId];
          await updateBlock(targetClip.id, { content: newContent });
        }
        return;
      } else {
        // raw block들끼리 재정렬
        const blockArr = rawBlocks;
        const oldIndex = blockArr.findIndex((b) => b.id === draggedId);
        if (oldIndex < 0) return;

        let newIndex: number;
        if (overId === PLACEHOLDER_ID) {
          // 끝에 추가
          newIndex = blockArr.length;
        } else {
          const foundIndex = blockArr.findIndex((b) => b.id === overId);
          if (foundIndex < 0) return;
          newIndex = foundIndex;
        }

        const reordered = arrayMove(blockArr, oldIndex, newIndex);
        for (let i = 0; i < reordered.length; i++) {
          await updateBlock(reordered[i].id, { properties: { sortOrder: i } });
        }
      }
    }
  };

  // (기존) 핸들러들
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

  // EndBlockAdder(+) 클릭
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

        {/**
         * (A) clip 블록들 → 별도의 SortableContext로 묶어줌
         *     clip들끼리 재정렬 가능
         */}
        <SortableContext
          items={clipBlocks.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
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
        </SortableContext>

        <hr className="my-4" />
        <h2 className="font-bold mb-2">{t("BLOCKS")}</h2>

        {/**
         * (B) raw 블록들 → 또다른 SortableContext로 묶어줌
         *     여기에서 block들끼리만 재정렬
         */}
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

        {/* 드래그 중 Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeBlock && <DragOverlayBlock block={activeBlock} />}
        </DragOverlay>
      </DndContext>
    </>
  );
}
