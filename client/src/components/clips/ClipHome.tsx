// client/src/components/clips/ClipHome.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IconMenu2 } from "@tabler/icons-react";
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { useBlockStore, BlockItem } from "@/store/blockStore";
import { ensureClipRunDoneListener } from "@/lib/ipcRendererOnce";
import BlockCreateModal from "@/components/BlockCreateModal";
import BlockPropertyForm from "@/components/BlockPropertyForm";

interface ClipHomeProps {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}

/**
 * ClipHome:
 *  - 메인 화면: clip 블록들과 other 블록들 표시
 *  - "Create Clip" 버튼 → BlockCreateModal
 *  - DnD 로 clip.content에 other 블록을 삽입
 */
export default function ClipHome({
  isSidebarOpen,
  onOpenSidebar,
}: ClipHomeProps) {
  const { t } = useTranslation();

  // blockStore
  const { blocks, loadBlocksFromDB, updateBlock, deleteBlock, runBlock } =
    useBlockStore();

  // 드래그 중인 블록 ID
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // 새 블록 생성 모달 열림 여부
  const [modalOpen, setModalOpen] = useState(false);

  // clip 블록 vs 기타 블록 분류
  const clipBlocks = blocks.filter((b) => b.type === "clip");
  const otherBlocks = blocks.filter((b) => b.type !== "clip");

  /**
   * 최초 마운트 시 블록 로딩 & IPC 리스너 등록
   */
  useEffect(() => {
    loadBlocksFromDB();
    ensureClipRunDoneListener();
  }, [loadBlocksFromDB]);

  /**
   * 드래그 시작 핸들러
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  /**
   * 드래그 끝났을 때
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveDragId(null);
      return;
    }
    // over.id = "clip-<clipId>" 형태이므로 clipId만 추출
    const overClipId = (over.id as string).replace("clip-", "");
    const draggedBlockId = active.id as string;

    if (overClipId === draggedBlockId) {
      // 자기 자신에 드래그했다면 아무 일도 안 함
      setActiveDragId(null);
      return;
    }

    // clipBlock 찾기
    const clipBlock = blocks.find((b) => b.id === overClipId);
    if (!clipBlock) {
      setActiveDragId(null);
      return;
    }

    // content 중복 방지
    if (!clipBlock.content.includes(draggedBlockId)) {
      const newContent = [...clipBlock.content, draggedBlockId];
      await updateBlock(clipBlock.id, { content: newContent });
    }
    setActiveDragId(null);
  };

  /**
   * clip 실행
   */
  const handleRunClip = (clipId: string) => {
    runBlock(clipId);
  };

  return (
    <>
      {/* (A) 새 블록 생성 모달 */}
      <BlockCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/**
       * DnDContext: 상단바 + clip 블록들 + other 블록들
       */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* 상단바 */}
        <div className="flex items-center justify-between mb-4">
          {/* 사이드바 접힘 상태면 열기 버튼 표시 */}
          {!isSidebarOpen && (
            <Button variant="ghost" onClick={onOpenSidebar}>
              <IconMenu2 className="w-5 h-5" />
            </Button>
          )}

          {/* 타이틀: My Clips */}
          <h1 className="text-xl font-bold">{t("MY_CLIPS")}</h1>

          {/* Create Clip 버튼 */}
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            {t("CREATE_CLIP")}
          </Button>
        </div>

        {/**
         * (B) clip 블록들
         */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {clipBlocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onUpdate={(patch) => updateBlock(block.id, patch)}
              onDelete={() => deleteBlock(block.id)}
              onRun={() => handleRunClip(block.id)}
            />
          ))}
        </div>

        {/**
         * (C) 기타 블록들
         */}
        <hr className="my-4" />
        <h2 className="font-bold mb-2">
          {t("OTHER_BLOCKS") || "Other Blocks"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherBlocks.map((b) => (
            <DraggableBlockItem key={b.id} block={b} />
          ))}
        </div>

        {/**
         * (D) 드래그 오버레이
         */}
        <DragOverlay>
          {activeDragId && (
            <div className="px-2 py-1 bg-gray-300 rounded border shadow">
              Dragging {activeDragId}...
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}

/**
 * BlockCard
 *  - clipBlock / otherBlock 모두 렌더 가능
 *  - droppable (clip-<id>)
 *  - edit 모드 시 BlockPropertyForm
 *  - run, delete, etc
 */
function BlockCard({
  block,
  onUpdate,
  onDelete,
  onRun,
}: {
  block: BlockItem;
  onUpdate: (patch: Partial<BlockItem>) => void;
  onDelete: () => void;
  onRun?: () => void; // clip일 때만 표시
}) {
  // droppable
  const { isOver, setNodeRef } = useDroppable({ id: `clip-${block.id}` });

  // 편집 모드 여부
  const [editing, setEditing] = useState(false);

  // 표시 이름
  const displayName =
    typeof block.properties.name === "string"
      ? block.properties.name
      : `Untitled ${block.type}`;

  return (
    <div
      ref={setNodeRef}
      className={`border rounded p-2 ${isOver ? "bg-yellow-100" : "bg-white"}`}
      style={{
        backgroundColor: (block.properties?.color as string) || undefined,
      }}
    >
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <strong>{displayName}</strong> <span>({block.id.slice(0, 6)})</span>
        </div>

        <div className="flex gap-2">
          {onRun && block.type === "clip" && (
            <Button variant="default" size="sm" onClick={onRun}>
              Run
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing((prev) => !prev)}
          >
            {editing ? "Close" : "Edit"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* 편집 or info */}
      {editing ? (
        <BlockPropertyForm
          blockType={block.type}
          properties={block.properties}
          onChange={(newType, newProps) => {
            onUpdate({ type: newType, properties: newProps });
          }}
        />
      ) : (
        <div className="text-xs text-gray-600">
          content children: {block.content.length} blocks
        </div>
      )}
    </div>
  );
}

/**
 * DraggableBlockItem
 *  - clip이 아닌 other block들
 *  - useDraggable로 드래그 가능
 */
function DraggableBlockItem({ block }: { block: BlockItem }) {
  // draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
    });

  // 스타일
  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: (block.properties?.color as string) ?? "#eee",
  };

  // 표시 이름
  const displayName =
    typeof block.properties.name === "string"
      ? block.properties.name
      : block.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-2 py-1 border rounded shadow cursor-pointer text-sm"
    >
      {displayName} ({block.id.slice(0, 6)})
    </div>
  );
}
