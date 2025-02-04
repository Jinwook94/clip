// client/src/components/BlockCreateModal.tsx
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

  const [localEditingBlock, setLocalEditingBlock] = useState<BlockItem | null>(
    editingBlock || null,
  );
  useEffect(() => {
    setLocalEditingBlock(editingBlock || null);
  }, [editingBlock]);

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

  const disableTypeSelection = editingBlock?.type === "clip";

  const connectedBlocks = localEditingBlock
    ? blocks.filter((b) => localEditingBlock.content.includes(b.id))
    : [];

  const actionBlockItem = connectedBlocks.find((b) => b.type === "action");
  const otherBlocks = connectedBlocks.filter((b) => b.type !== "action");

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
    ...(actionBlockItem ? [actionBlockItem as ExtendedBlockItem] : []),
    ...otherBlocks.map((b) => b as ExtendedBlockItem),
    ...missingBlocks,
  ];

  const [localConnectedBlocks, setLocalConnectedBlocks] =
    useState<ExtendedBlockItem[]>(finalConnectedBlocks);
  useEffect(() => {
    const currentIds = localConnectedBlocks.map((b) => b.id).join(",");
    const newIds = finalConnectedBlocks.map((b) => b.id).join(",");
    if (currentIds !== newIds) {
      setLocalConnectedBlocks(finalConnectedBlocks);
    }
  }, [finalConnectedBlocks, localConnectedBlocks]);

  const hasChanges = editingBlock
    ? editingBlock.type !== formData.type ||
      JSON.stringify(editingBlock.properties) !==
        JSON.stringify(formData.properties) ||
      JSON.stringify(editingBlock.content) !==
        JSON.stringify(localEditingBlock?.content || editingBlock.content)
    : true;

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

  // availableBlockTypes: DB에서 현재 생성된 모든 block type들을 조회
  const [availableBlockTypes, setAvailableBlockTypes] = useState<any[]>([]);
  useEffect(() => {
    window.ipcRenderer.invoke("blockTypes-load").then((types: any[]) => {
      setAvailableBlockTypes(types);
    });
  }, []);

  // 기존 선택된 block type definition (필드 렌더링용)
  const [blockTypeDefinition, setBlockTypeDefinition] = useState<any>(null);
  useEffect(() => {
    // availableBlockTypes가 로드되면 선택한 type에 해당하는 정의를 찾아 업데이트
    if (availableBlockTypes.length > 0) {
      const btDef = availableBlockTypes.find((bt) => bt.name === formData.type);
      setBlockTypeDefinition(btDef || null);
    }
  }, [formData.type, availableBlockTypes]);

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
          blockTypeDefinition={blockTypeDefinition}
          availableBlockTypes={availableBlockTypes}
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
                    {/* getBlockIcon 함수는 기존과 동일 */}
                    {formData.type === "action" ? (
                      <IconTerminal2 className="w-4 h-4" />
                    ) : (
                      <IconFile className="w-4 h-4" />
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
