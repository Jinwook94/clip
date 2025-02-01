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
  const [lastCreatedType, setLastCreatedType] =
    useState<string>("project_root");

  const [activeBlock, setActiveBlock] = useState<BlockItem | null>(null);
  const [_, setOverId] = useState<string | null>(null);
  const [overClipId, setOverClipId] = useState<string | null>(null);

  useEffect(() => {
    loadBlocksFromDB();
    ensureClipRunDoneListener();
  }, [loadBlocksFromDB]);

  const handleBlockCreated = (newType: string) => {
    setLastCreatedType(newType);
  };

  function getSort(block: BlockItem) {
    return typeof block.properties.sortOrder === "number"
      ? (block.properties.sortOrder as number)
      : 9999;
  }

  const clipBlocks = blocks
    .filter((b) => b.type === "clip")
    .sort((a, b) => getSort(a) - getSort(b));

  const rawBlocks = blocks
    .filter((b) => b.type !== "clip")
    .sort((a, b) => getSort(a) - getSort(b));

  const placeholderBlock: BlockItem = {
    id: PLACEHOLDER_ID,
    type: "placeholder",
    properties: {},
    content: [],
    parent: null,
  };
  const extendedBlocks = [...rawBlocks, placeholderBlock];

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = String(event.active.id);
    const found = blocks.find((b) => b.id === draggedId) || null;
    setActiveBlock(found);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const newOverId = event.over?.id ? String(event.over.id) : null;
    setOverId(newOverId);

    const draggedBlock = blocks.find((b) => b.id === event.active.id);
    if (draggedBlock && draggedBlock.type !== "clip") {
      const isOverClip = clipBlocks.some((cb) => cb.id === newOverId);
      setOverClipId(isOverClip ? newOverId : null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBlock(null);
    setOverId(null);
    setOverClipId(null);

    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    const draggedBlock = blocks.find((b) => b.id === draggedId);
    if (!draggedBlock) return;

    if (draggedBlock.type === "clip") {
      const oldIndex = clipBlocks.findIndex((b) => b.id === draggedId);
      if (oldIndex < 0) return;
      const newIndex = clipBlocks.findIndex((b) => b.id === overId);
      if (newIndex < 0) return;

      const reordered = arrayMove(clipBlocks, oldIndex, newIndex);
      for (let i = 0; i < reordered.length; i++) {
        await updateBlock(reordered[i].id, { properties: { sortOrder: i } });
      }
      return;
    }

    if (draggedBlock.type !== "clip") {
      const isOverClip = clipBlocks.some((cb) => cb.id === overId);

      if (isOverClip) {
        const targetClip = blocks.find((b) => b.id === overId);
        if (!targetClip) return;

        if (!targetClip.content.includes(draggedId)) {
          const newContent = [...targetClip.content, draggedId];
          await updateBlock(targetClip.id, { content: newContent });
        }
        return;
      } else {
        const blockArr = rawBlocks;
        const oldIndex = blockArr.findIndex((b) => b.id === draggedId);
        if (oldIndex < 0) return;

        let newIndex: number;
        if (overId === PLACEHOLDER_ID) {
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

  const handleAddBlockAtEnd = () => {
    setEditingBlock(null);
    setModalOpen(true);
  };

  return (
    <>
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

        <SortableContext
          items={clipBlocks.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {clipBlocks.map((block) => (
              <ClipBlockCard
                key={block.id}
                block={block}
                isOver={overClipId === block.id}
                onRunClip={handleRunClip}
                onEditBlock={handleEditBlock}
                onDeleteBlock={handleDeleteBlock}
              />
            ))}
          </div>
        </SortableContext>

        <hr className="my-4" />
        <h2 className="font-bold mb-2">{t("BLOCKS")}</h2>

        <SortableContext
          items={extendedBlocks.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {extendedBlocks.map((block) => {
              if (block.id === PLACEHOLDER_ID) {
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
