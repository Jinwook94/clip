import React from "react";
import { ActionType, useClipStore } from "@/store/clipStore";
import FileExplorer from "../FileExplorer";
import ActionEditor from "./ActionEditor";

export default function ClipEditor({ clipId }: { clipId: string }) {
  const clip = useClipStore((s) => s.clips.find((c) => c.id === clipId));
  const updateClip = useClipStore((s) => s.updateClip);

  if (!clip) return <div>Clip not found</div>;

  const onSelectPaths = (newPaths: string[]) => {
    updateClip(clipId, { selectedPaths: newPaths });
  };

  return (
    <div className="border p-2 space-y-3">
      <h3 className="font-bold">Edit: {clip.name}</h3>
      <div>
        <label>Action:</label>
        <select
          className="border ml-2"
          value={clip.actionType}
          onChange={(e) =>
            updateClip(clipId, { actionType: e.target.value as ActionType })
          }
        >
          <option value="copy">Copy</option>
          <option value="txtExtract">Txt Extract</option>
        </select>
      </div>

      <div>
        <label>Shortcut:</label>
        <input
          className="border ml-2 p-1"
          placeholder="CommandOrControl+Shift+X"
          value={clip.shortcut || ""}
          onChange={(e) => updateClip(clipId, { shortcut: e.target.value })}
        />
      </div>

      <FileExplorer
        projectRoot={clip.projectRoot}
        selectedPaths={clip.selectedPaths}
        onChangeSelected={onSelectPaths}
      />

      {clip.actionType === "txtExtract" && <ActionEditor clip={clip} />}
    </div>
  );
}
