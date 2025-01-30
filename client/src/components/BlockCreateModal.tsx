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
 *  - (A) editingBlock가 없으면 새 블록 생성
 *  - (B) editingBlock가 있으면 해당 블록 정보로 form 초기화 & Update
 *  - shadcn/ui 의 Dialog 컴포넌트를 사용
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

  // 폼 데이터
  const [formData, setFormData] = useState<BlockFormData>({
    type: "clip",
    properties: {},
  });

  useEffect(() => {
    if (editingBlock) {
      // 편집 모드
      setFormData({
        type: editingBlock.type,
        properties: { ...editingBlock.properties },
      });
    } else {
      // 새 블록 (기본값)
      setFormData({
        type: defaultType || "project_root", // 만약 defaultType이 없으면 project_root
        properties: {},
      });
    }
  }, [editingBlock, defaultType]);

  const handleSubmit = async () => {
    if (editingBlock) {
      // Update
      await updateBlock(editingBlock.id, {
        type: formData.type,
        properties: formData.properties,
      });
    } else {
      // Create
      await createBlock({
        type: formData.type,
        properties: formData.properties,
      });
    }
    // 생성 완료 후, 콜백
    onBlockCreated?.(formData.type);

    onClose();
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
