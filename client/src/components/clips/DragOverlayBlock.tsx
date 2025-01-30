// file: client/src/components/clips/DragOverlayBlock.tsx

import React from "react";
import type { BlockItem } from "@/store/blockStore";

/**
 * 드래그 중 표시되는 Overlay용 컴포넌트
 */
interface DragOverlayBlockProps {
  block: BlockItem;
}

export default function DragOverlayBlock({ block }: DragOverlayBlockProps) {
  const blockName =
    typeof block.properties.name === "string"
      ? block.properties.name
      : block.type;

  return (
    <div
      className="p-2 border rounded shadow bg-white"
      style={{ cursor: "grabbing", opacity: 0.75 }}
    >
      <div
        style={{
          backgroundColor: (block.properties.color as string) ?? "#eee",
        }}
        className="px-2 py-1 rounded text-sm"
      >
        {blockName} ({block.id.slice(0, 6)})
      </div>
    </div>
  );
}
