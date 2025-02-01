import React, { useState, useEffect, useMemo } from "react";
// 전역 블록 상태를 다루는 Zustand store hook을 import
import { useBlockStore } from "@/store/blockStore";
// UI에서 사용할 Button 컴포넌트를 import
import { Button } from "@/components/ui/button";
// Dialog 관련 컴포넌트들을 import (모달 구현용)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
// 블록의 속성 입력 폼 컴포넌트와 관련 타입을 import
import BlockPropertyForm, { BlockFormData } from "./BlockPropertyForm";
// 블록 타입(BlockItem)을 import
import type { BlockItem } from "@/store/blockStore";
// 다국어 처리를 위한 useTranslation hook을 import
import { useTranslation } from "react-i18next";
// 필요한 아이콘들을 Tabler 아이콘 라이브러리에서 import
import {
  IconLinkOff,
  IconHome,
  IconFile,
  IconTerminal2,
} from "@tabler/icons-react";

// ExtendedBlockItem 인터페이스는 BlockItem에 추가 UI용 속성(isEmpty, removing)을 허용
interface ExtendedBlockItem extends BlockItem {
  isEmpty?: boolean;
  removing?: boolean;
}

// BlockCreateModal 컴포넌트에 전달할 props 타입 정의
interface BlockCreateModalProps {
  open: boolean; // 모달이 열려있는지 여부
  onClose: () => void; // 모달 닫기 콜백
  editingBlock?: BlockItem; // 편집 모드일 경우 편집 대상 블록
  /**
   * 새 블록 생성 후 호출되는 콜백 (예: 마지막 생성된 블록 타입 설정)
   */
  onBlockCreated?: (newType: string) => void;
  /**
   * 편집 모드가 아닐 때 기본으로 사용할 블록 타입 (없으면 "project_root" 사용)
   */
  defaultType?: string;
}

/**
 * BlockCreateModal 컴포넌트는 블록을 생성 또는 편집할 수 있는 모달 다이얼로그를 제공합니다.
 * - editingBlock이 전달되면 해당 블록 정보를 기반으로 폼을 초기화합니다.
 * - 블록 타입이 "clip"일 경우, 연결된 블록(Connected Blocks) 영역을 하단에 표시합니다.
 *   연결된 블록 영역에서는 각 블록의 타입(label)과 이름을 자연스럽게 표시하며,
 *   연결 해제(disconnect) 버튼을 통해 해당 블록을 연결 해제할 수 있습니다.
 */
export default function BlockCreateModal({
  open,
  onClose,
  editingBlock,
  onBlockCreated,
  defaultType = "project_root",
}: BlockCreateModalProps) {
  // 다국어 처리를 위한 useTranslation hook
  const { t } = useTranslation();
  // 블록 생성/업데이트 함수를 전역 store에서 가져옴
  const createBlock = useBlockStore((s) => s.createBlock);
  const updateBlock = useBlockStore((s) => s.updateBlock);
  // 전체 블록 목록을 전역 store에서 가져옴
  const { blocks } = useBlockStore();

  // 편집 모드에서 사용하기 위해 editingBlock의 복사본을 로컬 state로 관리
  const [localEditingBlock, setLocalEditingBlock] = useState<BlockItem | null>(
    editingBlock || null,
  );
  useEffect(() => {
    setLocalEditingBlock(editingBlock || null);
  }, [editingBlock]);

  // localEditingBlock이 존재하면, 해당 블록의 content(연결된 블록 ID 목록)에 포함된 블록들을 필터링하여 connectedBlocks를 계산
  const connectedBlocks = localEditingBlock
    ? blocks.filter((b) => localEditingBlock.content.includes(b.id))
    : [];

  // 연결된 블록 중 type이 "action"인 블록을 찾음 (해당 블록은 항상 상단에 표시)
  const actionBlockItem = connectedBlocks.find((b) => b.type === "action");
  // 그 외의 연결된 블록들은 action 블록을 제외한 나머지로 분리
  const otherBlocks = connectedBlocks.filter((b) => b.type !== "action");

  // action 블록이 존재하면, 해당 블록의 requiredBlockTypes에 따라 누락된(연결되지 않은) 블록들을 계산
  const missingBlocks: ExtendedBlockItem[] = actionBlockItem
    ? (() => {
        // requiredBlockTypes가 지정되어 있으면 사용하고, 없으면 기본값(["project_root", "selected_path"]) 사용
        let requiredTypes =
          (actionBlockItem.properties.requiredBlockTypes as string[]) || [];
        if (
          requiredTypes.length === 0 &&
          (actionBlockItem.properties.actionType as string) === "copy"
        ) {
          requiredTypes = ["project_root", "selected_path"];
        }
        // 연결된 블록에 해당 타입이 없는 경우, 빈 슬롯 객체를 생성
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

  // 최종적으로 표시할 연결된 블록 목록은 action 블록(있으면 최상단), 그 외의 블록들, 그리고 누락된 빈 슬롯들을 합한 것
  // useMemo를 사용하여 의존성 값이 변경될 때만 새 배열을 생성하도록 함
  const finalConnectedBlocks = useMemo(() => {
    return [
      ...(actionBlockItem ? [actionBlockItem as ExtendedBlockItem] : []),
      ...otherBlocks.map((b) => b as ExtendedBlockItem),
      ...missingBlocks,
    ];
  }, [actionBlockItem, otherBlocks, missingBlocks]);

  // 로컬 state로 localConnectedBlocks를 관리하여 연결 해제 애니메이션 효과 적용
  const [localConnectedBlocks, setLocalConnectedBlocks] =
    useState<ExtendedBlockItem[]>(finalConnectedBlocks);
  // finalConnectedBlocks가 변경되었을 때, 실제로 값이 달라졌다면 localConnectedBlocks를 업데이트
  useEffect(() => {
    const currentIds = localConnectedBlocks.map((b) => b.id).join(",");
    const newIds = finalConnectedBlocks.map((b) => b.id).join(",");
    if (currentIds !== newIds) {
      setLocalConnectedBlocks(finalConnectedBlocks);
    }
  }, [finalConnectedBlocks, localConnectedBlocks]);

  // 블록 생성/편집 폼의 데이터를 관리하는 state (블록 타입과 속성)
  const [formData, setFormData] = useState<BlockFormData>({
    type: "clip",
    properties: {},
  });
  // 편집 모드이면 editingBlock의 값을 폼 데이터에 반영, 아니면 기본 타입을 사용
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

  // 폼 제출 시, 편집 모드이면 업데이트, 아니면 새 블록 생성 후 모달 닫기 및 콜백 호출
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

  /**
   * getBlockIcon 함수는 블록 타입에 따라 적절한 아이콘을 반환합니다.
   * - "action" 타입의 경우, 전달받은 색상(blockColor)을 인라인 스타일로 적용합니다.
   * - 그 외의 타입은 기본 아이콘만 반환합니다.
   *
   * @param type - 블록의 타입
   * @param blockColor - action 블록에 사용할 색상 (선택적)
   * @returns JSX.Element 아이콘 컴포넌트
   */
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

  /**
   * disconnectBlock 함수는 연결된 블록을 해제합니다.
   * - 만약 블록의 타입이 "action"이면, 사용자에게 확인을 요청합니다.
   * - 해제 시 해당 블록의 'removing' 플래그를 true로 설정하여 애니메이션 효과를 주고,
   *   300ms 후에 전역 블록의 content에서 해당 블록을 제거합니다.
   *
   * @param blockId - 해제할 블록의 ID
   * @param blockType - 해제할 블록의 타입
   */
  const disconnectBlock = (blockId: string, blockType: string) => {
    // action 블록인 경우, 사용자에게 해제 여부를 확인
    if (blockType === "action") {
      const confirmed = window.confirm(
        "Action 블록은 매우 중요합니다. 정말 해제하시겠습니까?",
      );
      if (!confirmed) return;
    }
    // 로컬 연결 목록(localConnectedBlocks)에서 해당 블록의 removing 플래그를 true로 설정하여 애니메이션을 시작
    setLocalConnectedBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, removing: true } : b)),
    );
    // 300ms 후에 전역 블록 상태를 업데이트하여 실제 연결 해제 처리
    setTimeout(async () => {
      if (localEditingBlock) {
        const newContent = localEditingBlock.content.filter(
          (id) => id !== blockId,
        );
        // 로컬 편집 블록 업데이트
        setLocalEditingBlock({ ...localEditingBlock, content: newContent });
        // 전역 블록 업데이트 (DB 및 상태 업데이트)
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

        {/* 블록 속성 입력 폼 렌더링 */}
        <BlockPropertyForm
          blockType={formData.type}
          properties={formData.properties}
          onChange={(newType, newProps) => {
            setFormData({ type: newType, properties: newProps });
          }}
        />

        {/* 블록 타입이 "clip"이고 편집 모드인 경우, 연결된 블록(Connected Blocks) 영역을 렌더링 */}
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
                    {/* 아이콘은 action 블록의 경우에만 전달받은 색상을 적용하고, 나머지는 기본 아이콘 */}
                    {getBlockIcon(
                      block.type,
                      block.type === "action"
                        ? (block.properties as { color?: string }).color
                        : undefined,
                    )}
                    {/* 블록의 이름 위에 블록 타입(label)을 작고 자연스럽게 표시 */}
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
                  {/* 실제 연결된 블록일 경우, disconnect 버튼을 렌더링 */}
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
