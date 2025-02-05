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
import { IconFile, IconTerminal2, IconX } from "@tabler/icons-react";

interface ExtendedBlockItem extends BlockItem {
  isEmpty?: boolean;
  removing?: boolean;
}

interface BlockCreateModalProps {
  open: boolean;
  onClose: () => void;
  editingBlock?: BlockItem;
  onBlockCreated?: (newType: string) => void;
  defaultType?: string;
}

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

  // 편집 모드에서 사용하기 위해 editingBlock의 복사본을 로컬 state로 관리
  const [localEditingBlock, setLocalEditingBlock] = useState<BlockItem | null>(
    editingBlock || null,
  );
  useEffect(() => {
    setLocalEditingBlock(editingBlock || null);
  }, [editingBlock]);

  // 폼 데이터 state (블록 타입과 속성)
  const [formData, setFormData] = useState<BlockFormData>({
    type: "clip",
    properties: {},
  });
  useEffect(() => {
    if (editingBlock) {
      setFormData({
        type: editingBlock.type,
        properties: { ...editingBlock.properties },
      });
    } else {
      setFormData({
        type: defaultType || "clip",
        properties: {},
      });
    }
  }, [editingBlock, defaultType]);

  // 편집 모달에서 clip 블록은 수정 불가능하므로 블록 타입 선택 영역을 숨깁니다.
  const disableTypeSelection = editingBlock?.type === "clip";

  // localEditingBlock의 content에 포함된 블록들을 connectedBlocks로 계산
  const connectedBlocks = localEditingBlock
    ? blocks.filter((b) => localEditingBlock.content.includes(b.id))
    : [];

  // 연결된 블록 중 type이 "action"인 블록 (상단에 표시)
  const actionBlockItem = connectedBlocks.find((b) => b.type === "action");
  // 그 외의 연결된 블록들은 action 블록을 제외한 나머지
  const otherBlocks = connectedBlocks.filter((b) => b.type !== "action");

  // "clip" 블록인 경우, required block 타입들을 계산 – 이제 더 이상 추가 타입은 사용하지 않음
  const requiredTypes: string[] = [];
  // 누락된(아직 연결되지 않은) required 블록들을 empty slot으로 표시
  const missingBlocks: ExtendedBlockItem[] = requiredTypes.map((rt) => ({
    id: `empty-${rt}`,
    type: rt,
    isEmpty: true,
    properties: {},
    content: [],
    parent: null,
  }));

  // 최종적으로 표시할 연결된 블록 목록: action 블록, 기타 연결된 블록, 누락된 빈 슬롯
  const finalConnectedBlocks = useMemo(() => {
    return [
      ...(actionBlockItem ? [actionBlockItem as ExtendedBlockItem] : []),
      ...otherBlocks.map((b) => b as ExtendedBlockItem),
      ...missingBlocks,
    ];
  }, [actionBlockItem, otherBlocks, missingBlocks]);

  // 로컬 연결 블록 state (애니메이션 효과 적용)
  const [localConnectedBlocks, setLocalConnectedBlocks] =
    useState<ExtendedBlockItem[]>(finalConnectedBlocks);
  useEffect(() => {
    const currentIds = localConnectedBlocks.map((b) => b.id).join(",");
    const newIds = finalConnectedBlocks.map((b) => b.id).join(",");
    if (currentIds !== newIds) {
      setLocalConnectedBlocks(finalConnectedBlocks);
    }
  }, [finalConnectedBlocks, localConnectedBlocks]);

  // 편집 모드일 때, 원래의 값과 현재 값의 차이를 비교하여 Update 버튼 활성화 여부 결정
  const hasChanges = editingBlock
    ? editingBlock.type !== formData.type ||
      JSON.stringify(editingBlock.properties) !==
        JSON.stringify(formData.properties) ||
      JSON.stringify(editingBlock.content) !==
        JSON.stringify(localEditingBlock?.content || editingBlock.content)
    : true;

  // 폼 제출 시: 편집 모드이면 업데이트(연결된 블록 포함), 아니면 새 블록 생성
  const handleSubmit = async () => {
    if (editingBlock) {
      await updateBlock(editingBlock.id, {
        type: formData.type,
        properties: formData.properties,
        content: localEditingBlock?.content || editingBlock.content,
      });
    } else {
      await createBlock({
        type: formData.type,
        properties: formData.properties,
      });
    }
    onBlockCreated?.(formData.type);
    onClose();
  };

  const getBlockIcon = (type: string, blockColor?: string) => {
    if (type === "action") {
      return (
        <IconTerminal2 className="w-4 h-4" style={{ color: blockColor }} />
      );
    }
    // 다른 타입은 기본 아이콘 사용
    return <IconFile className="w-4 h-4" />;
  };

  const disconnectBlock = (blockId: string, blockType: string) => {
    if (blockType === "action") {
      const confirmed = window.confirm(
        "Action 블록은 매우 중요합니다. 정말 해제하시겠습니까?",
      );
      if (!confirmed) return;
    }
    setLocalConnectedBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, removing: true } : b)),
    );
    setTimeout(() => {
      if (localEditingBlock) {
        const newContent = localEditingBlock.content.filter(
          (id) => id !== blockId,
        );
        setLocalEditingBlock({ ...localEditingBlock, content: newContent });
      }
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-w-[400px]">
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
          disableTypeSelection={disableTypeSelection}
        />

        {formData.type === "clip" && localEditingBlock && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">
              {t("CONNECTED_BLOCKS", "Connected Blocks")}
            </h3>
            <div className="space-y-2">
              {localConnectedBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between p-2 border rounded transition-all duration-300 ${
                    block.removing
                      ? "opacity-0 h-0 overflow-hidden"
                      : block.isEmpty
                        ? "bg-transparent border-dashed border-gray-300"
                        : block.type === "action"
                          ? "bg-yellow-50 border-yellow-400"
                          : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getBlockIcon(
                      block.type,
                      block.type === "action"
                        ? (block.properties as { color?: string }).color
                        : undefined,
                    )}
                    <div className="flex flex-col">
                      <div className="text-xs text-gray-500">{block.type}</div>
                      <div className="text-sm font-bold">
                        {block.isEmpty
                          ? t("EMPTY_SLOT", `Empty ${block.type}`)
                          : ((block.properties as { name?: string }).name ??
                            block.type)}
                      </div>
                    </div>
                  </div>
                  {!block.isEmpty && (
                    <button
                      onClick={() => disconnectBlock(block.id, block.type)}
                      title={t("DISCONNECT", "Disconnect")}
                      className="p-1"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
