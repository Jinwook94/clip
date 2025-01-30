// file: client/src/components/clips/EndBlockAdder.tsx

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface EndBlockAdderProps {
  onAddBlock?: () => void;
}

/**
 * EndBlockAdder
 *  - '마지막 뒤' 드롭 가능 영역
 *  - hover 시 살짝 배경색 변화를 줌 (hover:bg-gray-50)
 */
export default function EndBlockAdder({ onAddBlock }: EndBlockAdderProps) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({ id: "__end__" });

  const handleClick = () => {
    onAddBlock?.();
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className="
        flex items-center justify-center
        border border-dashed border-gray-300
        hover:bg-gray-50
        transition-colors
      "
      style={{
        cursor: "pointer",
        minHeight: "50px",
        backgroundColor: "#fff",
      }}
      title={t("ADD_BLOCK_TOOLTIP") || "Add a new block"}
    >
      <IconPlus className="w-5 h-5 text-gray-400" />
    </div>
  );
}
