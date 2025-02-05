import React, { useState, useEffect, useMemo } from "react";
import { useBlockStore } from "@/store/blockStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import BlockPropertyForm, { BlockFormData } from "./BlockPropertyForm";
import type { BlockItem } from "@/store/blockStore";
import { useTranslation } from "react-i18next";
import { IconFile, IconTerminal2, IconX, IconPlus } from "@tabler/icons-react";

/** 확장 인터페이스 (UI 표현용) */
interface ExtendedBlockItem extends BlockItem {
  isEmpty?: boolean;
  removing?: boolean;
}

/** 모달 Props */
interface BlockCreateModalProps {
  open: boolean;
  onClose: () => void;
  editingBlock?: BlockItem;
  onBlockCreated?: (newType: string) => void;
  defaultType?: string;
}

/**
 * BlockCreateModal
 *  - clip 블록일 경우: 마스터-디테일(2열) 뷰
 *  - clip이 아니면: 기존 단일 폼 뷰
 */
export default function BlockCreateModal({
  open,
  onClose,
  editingBlock,
  onBlockCreated,
  defaultType = "clip",
}: BlockCreateModalProps) {
  const { t } = useTranslation();
  const createBlock = useBlockStore((s) => s.createBlock);
  const updateBlock = useBlockStore((s) => s.updateBlock);
  const { blocks } = useBlockStore();

  // 현재(부모) 블록 (주로 clip)
  const [localEditingBlock, setLocalEditingBlock] = useState<BlockItem | null>(
    editingBlock || null,
  );

  // 폼 데이터 (부모 블록)
  const [formData, setFormData] = useState<BlockFormData>({
    type: defaultType,
    properties: {},
  });

  // 선택된 자식 블록 (clip 모드일 때만 사용)
  const [selectedChildBlock, setSelectedChildBlock] =
    useState<BlockItem | null>(null);

  // 모달 열릴 때 초기 세팅
  useEffect(() => {
    setLocalEditingBlock(editingBlock || null);
    if (editingBlock) {
      setFormData({
        type: editingBlock.type,
        properties: { ...editingBlock.properties },
      });
    } else {
      setFormData({
        type: defaultType,
        properties: {},
      });
    }
    // 자식 블록 선택 해제
    setSelectedChildBlock(null);
  }, [editingBlock, defaultType]);

  // clip인지 여부 (부모 블록 타입)
  const isClip = editingBlock?.type === "clip" || formData.type === "clip";

  // 변경 감지 (부모)
  const hasChanges = editingBlock
    ? editingBlock.type !== formData.type ||
      JSON.stringify(editingBlock.properties) !==
        JSON.stringify(formData.properties) ||
      JSON.stringify(editingBlock.content) !==
        JSON.stringify(localEditingBlock?.content || editingBlock.content)
    : true;

  // clip 모드에서 연결된 자식 블록 목록
  const connectedBlocks = useMemo(() => {
    if (isClip && localEditingBlock) {
      return blocks.filter((b) => localEditingBlock.content.includes(b.id));
    }
    return [];
  }, [isClip, localEditingBlock, blocks]);

  /** 최종 제출(부모 clip 저장/생성) */
  const handleSubmit = async () => {
    if (!localEditingBlock) {
      // 새 clip 생성
      const newId = await createBlock({
        type: formData.type,
        properties: formData.properties,
      });
      onBlockCreated?.(formData.type);
      console.log("Created block =>", newId);
    } else {
      // 업데이트(clip 수정)
      await updateBlock(localEditingBlock.id, {
        type: formData.type,
        properties: formData.properties,
        content: localEditingBlock.content,
      });
      console.log("Updated block =>", localEditingBlock.id);
    }
    onClose();
  };

  /** ============ Case1: clip 블록 => 2열(마스터-디테일) 뷰 ============ */
  if (isClip) {
    // 특정 예시: action 블록을 먼저 띄우고, 나머지 블록 그다음
    const actionBlockItem = connectedBlocks.find((b) => b.type === "action");
    const otherBlocks = connectedBlocks.filter((b) => b.type !== "action");

    // 예: requiredTypes 등 처리
    const requiredTypes: string[] = [];
    const missingBlocks: ExtendedBlockItem[] = requiredTypes.map((rt) => ({
      id: `empty-${rt}`,
      type: rt,
      isEmpty: true,
      properties: {},
      content: [],
      parent: null,
    }));

    const finalConnectedBlocks = [
      ...(actionBlockItem ? [actionBlockItem] : []),
      ...otherBlocks,
      ...missingBlocks,
    ];

    /** 자식 블록 해제 */
    const disconnectBlock = (childId: string) => {
      if (!localEditingBlock) return;
      const newContent = localEditingBlock.content.filter(
        (id) => id !== childId,
      );
      setLocalEditingBlock({ ...localEditingBlock, content: newContent });
      if (selectedChildBlock?.id === childId) {
        setSelectedChildBlock(null);
      }
    };

    /** 자식 블록 새로 만들기 (snippet 예시) */
    const handleCreateChildBlock = async () => {
      const newId = await createBlock({
        type: "snippet",
        properties: { name: "", text: "" },
      });
      if (!localEditingBlock) return;
      const newContent = [...localEditingBlock.content, newId];
      setLocalEditingBlock({ ...localEditingBlock, content: newContent });
    };

    /** 자식 블록 업데이트 */
    const handleUpdateChildBlock = async (
      blockId: string,
      patch: Partial<BlockItem>,
    ) => {
      await updateBlock(blockId, patch);
      console.log("Updated child block =>", blockId);
    };

    return (
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        {/* 폭, 높이 고정 */}
        <DialogContent
          className="w-[700px] max-w-none h-[600px]"
          aria-describedby={undefined}
          style={{ maxWidth: "unset" }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? t("EDIT_BLOCK") : t("CREATE_NEW_BLOCK")}
            </DialogTitle>
          </DialogHeader>

          {/**
           * 2열 레이아웃.
           *  - 높이에서 상단 100px 정도 Title 등 뺀 후, 남은 공간 500px
           */}
          <div className="flex gap-4 h-[500px]">
            {/* 왼쪽: 부모(clip) + 연결된 블록 목록 */}
            <div className="w-1/3 border-r pr-2 flex flex-col">
              {/* (A) Clip(부모) Form */}
              <div className="mb-4">
                <BlockPropertyForm
                  blockType={formData.type}
                  properties={formData.properties}
                  onChange={(newType, newProps) => {
                    setFormData({ type: newType, properties: newProps });
                  }}
                  disableTypeSelection={true} // type 변경 X
                />
              </div>

              {/* (B) 자식 블록 목록 */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">
                    {t("CONNECTED_BLOCKS", "Connected Blocks")}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleCreateChildBlock}
                  >
                    <IconPlus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-auto space-y-1">
                  {finalConnectedBlocks.map((child) => {
                    const extChild = child as ExtendedBlockItem;
                    const isSelected = selectedChildBlock?.id === child.id;
                    const isEmptyBlock = !!extChild.isEmpty;
                    const displayName =
                      (child.properties.name as string) || child.type;

                    return (
                      // group 클래스로 감싸 hover 시 아이콘X 표시
                      <div
                        key={child.id}
                        onClick={() => {
                          if (!isEmptyBlock) {
                            setSelectedChildBlock(child);
                          }
                        }}
                        className={
                          "group relative flex items-center justify-between border p-2 rounded cursor-pointer transition-colors " +
                          (isEmptyBlock
                            ? "bg-gray-50 border-dashed"
                            : isSelected
                              ? "bg-blue-50 border-blue-400"
                              : "bg-white hover:bg-gray-50")
                        }
                      >
                        <div className="flex items-center gap-2">
                          {child.type === "action" ? (
                            <IconTerminal2 className="w-4 h-4" />
                          ) : (
                            <IconFile className="w-4 h-4" />
                          )}
                          <div className="text-sm font-medium">
                            {isEmptyBlock
                              ? t("EMPTY_SLOT", `Empty ${child.type}`)
                              : displayName}
                          </div>
                        </div>

                        {!isEmptyBlock && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              disconnectBlock(child.id);
                            }}
                            // hover 시에만 아이콘 표시
                            className="invisible group-hover:visible"
                          >
                            <IconX className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {finalConnectedBlocks.length === 0 && (
                    <div className="text-sm text-gray-400">
                      No connected blocks.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 선택된 자식 블록 디테일 편집 */}
            <div className="flex-1 overflow-hidden">
              {selectedChildBlock ? (
                <DetailChildEditor
                  childBlock={selectedChildBlock}
                  onUpdateChild={handleUpdateChildBlock}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Select a connected block to edit.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={onClose}>
              {t("CANCEL")}
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={editingBlock ? !hasChanges : false}
            >
              {editingBlock ? t("UPDATE") : t("CREATE")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /** ============ Case2: clip이 아닐 때 => 기존 단일 폼 모달 ============ */
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[400px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {editingBlock ? t("EDIT_BLOCK") : t("CREATE_NEW_BLOCK")}
          </DialogTitle>
        </DialogHeader>

        <BlockPropertyForm
          blockType={formData.type}
          properties={formData.properties}
          onChange={(newType, newProps) => {
            setFormData({ type: newType, properties: newProps });
          }}
          disableTypeSelection={editingBlock?.type === "clip"}
        />

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>
            {t("CANCEL")}
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={editingBlock ? !hasChanges : false}
          >
            {editingBlock ? t("UPDATE") : t("CREATE")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 자식 블록 편집 서브컴포넌트
 * - BlockType은 표시하되 수정은 불가능(읽기 전용)
 */
function DetailChildEditor({
  childBlock,
  onUpdateChild,
}: {
  childBlock: BlockItem;
  onUpdateChild: (blockId: string, patch: Partial<BlockItem>) => void;
}) {
  const { t } = useTranslation();
  const [localProps, setLocalProps] = useState({ ...childBlock.properties });
  const blockType = childBlock.type; // 표시만 할 값

  const handleSave = async () => {
    await onUpdateChild(childBlock.id, {
      properties: localProps,
    });
  };

  useEffect(() => {
    setLocalProps({ ...childBlock.properties });
  }, [childBlock]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-2 text-sm">
        <span className="text-gray-700">{blockType} block</span>
      </div>

      {/* 속성 편집 (block type 고정, disableTypeSelection */}
      <div className="flex-1 overflow-auto p-2 border rounded">
        <BlockPropertyForm
          blockType={blockType}
          properties={localProps}
          // blockType은 읽기전용 => disableTypeSelection
          disableTypeSelection={true}
          onChange={(_newType, newProps) => {
            setLocalProps(newProps);
          }}
        />
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={handleSave}>
          {t("UPDATE")}
        </Button>
      </div>
    </div>
  );
}
