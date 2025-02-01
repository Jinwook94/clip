import React, { useState, useEffect } from "react";
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
import {
  IconLinkOff,
  IconHome,
  IconFile,
  IconTerminal2,
} from "@tabler/icons-react";

// ExtendedBlockItem 인터페이스를 추가하여 isEmpty 및 removing 속성을 사용할 수 있도록 함
interface ExtendedBlockItem extends BlockItem {
  isEmpty?: boolean;
  removing?: boolean;
}

interface BlockCreateModalProps {
  open: boolean;
  onClose: () => void;
  editingBlock?: BlockItem;
  /**
   * 새 블록 생성이 끝났을 때 호출되는 콜백
   *  - (ex) setLastCreatedType(formData.type)
   */
  onBlockCreated?: (newType: string) => void;
  /**
   * editingBlock가 없을 때, 기본 type 지정
   *  - (없으면 "project_root" 기본)
   */
  defaultType?: string;
}

/**
 * BlockCreateModal
 *  - editingBlock가 없으면 새 블록 생성, 있으면 해당 블록 정보로 편집/업데이트
 *  - Dialog 컴포넌트를 사용
 */
export default function BlockCreateModal({
  open,
  onClose,
  editingBlock,
  onBlockCreated,
  defaultType = "project_root",
}: BlockCreateModalProps) {
  const { t } = useTranslation();
  const createBlock = useBlockStore((s) => s.createBlock);
  const updateBlock = useBlockStore((s) => s.updateBlock);
  const { blocks } = useBlockStore();

  // 편집 모드용 local state: editingBlock의 복사본을 관리하여 UI에 반영
  const [localEditingBlock, setLocalEditingBlock] = useState<BlockItem | null>(
    editingBlock || null,
  );
  useEffect(() => {
    setLocalEditingBlock(editingBlock || null);
  }, [editingBlock]);

  // localEditingBlock을 기준으로 연결된 블록 목록 계산
  const connectedBlocks = localEditingBlock
    ? blocks.filter((b) => localEditingBlock.content.includes(b.id))
    : [];

  // action 블록은 최상단에, 나머지 블록 및 누락된(required) 블록(빈 슬롯) 표시
  const actionBlockItem = connectedBlocks.find((b) => b.type === "action");
  const otherBlocks = connectedBlocks.filter((b) => b.type !== "action");

  const missingBlocks: ExtendedBlockItem[] = actionBlockItem
    ? (() => {
        let requiredTypes =
          (actionBlockItem.properties.requiredBlockTypes as string[]) || [];
        if (
          requiredTypes.length === 0 &&
          (actionBlockItem.properties.actionType as string) === "copy"
        ) {
          requiredTypes = ["project_root", "selected_path"];
        }
        return requiredTypes
          .filter((rt) => !connectedBlocks.some((b) => b.type === rt))
          .map((rt) => ({
            id: `empty-${rt}`,
            type: rt,
            isEmpty: true,
            properties: {},
            content: [],
            parent: null,
          }));
      })()
    : [];

  const finalConnectedBlocks: ExtendedBlockItem[] = [
    ...(actionBlockItem ? [actionBlockItem as ExtendedBlockItem] : []),
    ...otherBlocks.map((b) => b as ExtendedBlockItem),
    ...missingBlocks,
  ];

  // 로컬 상태로 관리하여 애니메이션 적용
  const [localConnectedBlocks, setLocalConnectedBlocks] =
    useState<ExtendedBlockItem[]>(finalConnectedBlocks);
  useEffect(() => {
    setLocalConnectedBlocks(finalConnectedBlocks);
  }, [finalConnectedBlocks]);

  // 폼 데이터
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
        type: defaultType || "project_root",
        properties: {},
      });
    }
  }, [editingBlock, defaultType]);

  const handleSubmit = async () => {
    if (editingBlock) {
      await updateBlock(editingBlock.id, {
        type: formData.type,
        properties: formData.properties,
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

  // 각 블록 타입에 맞는 아이콘 반환 함수
  // action 블록은 전달받은 color를 inline style로 적용하고, 나머지는 기본 아이콘만 반환
  const getBlockIcon = (type: string, blockColor?: string) => {
    if (type === "action") {
      return (
        <IconTerminal2 className="w-4 h-4" style={{ color: blockColor }} />
      );
    }
    switch (type) {
      case "project_root":
        return <IconHome className="w-4 h-4" />;
      case "selected_path":
        return <IconFile className="w-4 h-4" />;
      default:
        return <IconFile className="w-4 h-4" />;
    }
  };

  // disconnect 함수: localEditingBlock 상태 업데이트 후 updateBlock 호출
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
    setTimeout(async () => {
      if (localEditingBlock) {
        const newContent = localEditingBlock.content.filter(
          (id) => id !== blockId,
        );
        setLocalEditingBlock({ ...localEditingBlock, content: newContent });
        await updateBlock(localEditingBlock.id, { content: newContent });
      }
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {editingBlock ? t("EDIT_BLOCK") : t("CREATE_NEW_BLOCK")}
          </DialogTitle>
        </DialogHeader>

        {/* 실제 폼 내용 */}
        <BlockPropertyForm
          blockType={formData.type}
          properties={formData.properties}
          onChange={(newType, newProps) => {
            setFormData({ type: newType, properties: newProps });
          }}
        />

        {/* clip 타입일 경우, 편집 모드에서 연결된 block들을 표시 */}
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
                    block.removing ? "opacity-0 h-0 overflow-hidden" : ""
                  } ${
                    block.type === "action"
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
                  {/* 실제 연결된 블록이면 disconnect 버튼 표시 */}
                  {!block.isEmpty && (
                    <button
                      onClick={() => disconnectBlock(block.id, block.type)}
                      title={t("DISCONNECT", "Disconnect")}
                      className="p-1"
                    >
                      <IconLinkOff className="w-4 h-4" />
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
          <Button variant="default" onClick={handleSubmit}>
            {editingBlock ? t("UPDATE") : t("CREATE")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
