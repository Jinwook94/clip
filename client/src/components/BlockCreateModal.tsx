import React, { useState } from "react";
import { useBlockStore } from "@/store/blockStore";
import { Button } from "@/components/ui/button";
import BlockPropertyForm, { BlockFormData } from "./BlockPropertyForm";

/**
 * 모달을 열어서 새 Block을 생성하는 컴포넌트.
 *  - type 선택 → type에 맞는 속성 입력
 */
interface BlockCreateModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * BlockCreateModal
 *  - 모달 내부에서 BlockPropertyForm을 렌더링
 *  - Confirm하면 createBlock()
 */
export default function BlockCreateModal({
  open,
  onClose,
}: BlockCreateModalProps) {
  const createBlock = useBlockStore((s) => s.createBlock);

  // 생성 시점을 위해 임시 form data를 보관
  const [formData, setFormData] = useState<BlockFormData>({
    type: "clip",
    properties: {},
  });

  if (!open) return null;

  const handleSubmit = async () => {
    // createBlock 호출
    await createBlock({
      type: formData.type,
      properties: formData.properties,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-4 w-[400px] shadow-md">
        <h2 className="text-lg font-bold mb-2">Create a New Block</h2>
        <BlockPropertyForm
          blockType={formData.type}
          properties={formData.properties}
          onChange={(newType, newProps) => {
            setFormData({ type: newType, properties: newProps });
          }}
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
