import React, { useState } from "react";
import { useClipStore } from "@/store/clipStore";
import FileExplorer from "@/components/FileExplorer";
import { Button } from "@/components/ui/button";

export default function ClipCreateForm({ onClose }: { onClose: () => void }) {
  const addClip = useClipStore((s) => s.addClip);

  // Form state
  const [clipName, setClipName] = useState("");
  const [projectRoot, setProjectRoot] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [actionType, setActionType] = useState<"copy" | "txtExtract">("copy");

  // (선택) gitRoot 등 다른 필드가 필요하면 추가

  const handlePickFolder = async () => {
    const folder = await window.ipcRenderer.invoke("show-directory-dialog");
    if (folder) {
      setProjectRoot(folder);
    }
  };

  const handleCreate = () => {
    if (!clipName || !projectRoot) {
      alert("Clip Name / Project Root is required!");
      return;
    }
    // Zustand store에 추가
    addClip({
      name: clipName,
      projectRoot,
      selectedPaths,
      actionType,
    });
    // 폼 초기화 & 닫기
    setClipName("");
    setProjectRoot("");
    setSelectedPaths([]);
    onClose();
  };

  return (
    <div className="p-3 border rounded space-y-2">
      <div>
        <label className="block font-semibold">Clip Name:</label>
        <input
          className="border p-1 w-full"
          value={clipName}
          onChange={(e) => setClipName(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">Project Root:</label>
        <div className="flex gap-2">
          <input
            className="border p-1 w-full"
            placeholder="/path/to/your-project"
            value={projectRoot}
            onChange={(e) => setProjectRoot(e.target.value)}
          />
          <Button variant="outline" onClick={handlePickFolder}>
            Pick Folder
          </Button>
        </div>
      </div>

      {/* Action Type */}
      <div>
        <label className="block font-semibold">Action:</label>
        <select
          className="border p-1"
          value={actionType}
          onChange={(e) => setActionType(e.target.value as any)}
        >
          <option value="copy">copy</option>
          <option value="txtExtract">txtExtract</option>
        </select>
      </div>

      {/* FileExplorer (Project Root가 있을 때만 표시) */}
      {projectRoot ? (
        <div className="mt-2 p-2 border">
          <p className="font-semibold">Select Action Target Files:</p>
          <FileExplorer
            projectRoot={projectRoot}
            selectedPaths={selectedPaths}
            onChangeSelected={setSelectedPaths}
          />
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Pick a Project Root first.</p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleCreate}>Create</Button>
      </div>
    </div>
  );
}
