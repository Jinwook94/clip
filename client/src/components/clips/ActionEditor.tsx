import React from "react";
import { ClipItem, useClipStore } from "@/store/clipStore";

export default function ActionEditor({ clip }: { clip: ClipItem }) {
  const updateClip = useClipStore((s) => s.updateClip);

  if (clip.actionType !== "txtExtract") return null;

  return (
    <div className="mt-2">
      <label className="block font-bold mb-1">Txt Extract Script:</label>
      <textarea
        className="border w-full h-32 p-1 font-mono"
        value={clip.actionCode || ""}
        onChange={(e) => updateClip(clip.id, { actionCode: e.target.value })}
      />
      <small className="text-gray-500">
        (Here you can put your custom script for extracting text from files.)
      </small>
    </div>
  );
}
