import React, { useState } from "react";
import { useClipStore } from "@/store/clipStore";
import ClipEditor from "./ClipEditor";

export default function ClipManager() {
  const clips = useClipStore((s) => s.clips);
  const addClip = useClipStore((s) => s.addClip);
  const removeClip = useClipStore((s) => s.removeClip);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newProjectRoot, setNewProjectRoot] = useState("");

  // 함수에 async 추가
  const handleCreateClip = async () => {
    if (!newName) return;

    // addClip(...)은 Promise<string> 이므로 await
    const newId = await addClip({
      name: newName,
      projectRoot: newProjectRoot || "/Users/test/my-project",
      selectedPaths: [],
      actionType: "copy",
    });

    setSelectedId(newId);
    setNewName("");
    setNewProjectRoot("");
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold">Clips</h2>
      <div className="flex gap-2 mt-2">
        <input
          className="border p-1"
          placeholder="Clip Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className="border p-1"
          placeholder="Project Root"
          value={newProjectRoot}
          onChange={(e) => setNewProjectRoot(e.target.value)}
        />
        <button
          onClick={handleCreateClip}
          className="bg-blue-500 text-white px-3"
        >
          Create
        </button>
      </div>

      <ul className="mt-4 space-y-1">
        {clips.map((clip) => (
          <li
            key={clip.id}
            className={`cursor-pointer p-1 ${clip.id === selectedId ? "bg-gray-200" : ""}`}
            onClick={() => setSelectedId(clip.id)}
          >
            <div className="flex justify-between">
              <span>
                [{clip.id.slice(0, 6)}] {clip.name}
              </span>
              <button
                className="text-red-500 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (clip.id === selectedId) setSelectedId(null);
                  removeClip(clip.id);
                }}
              >
                X
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedId && (
        <div className="mt-4">
          <ClipEditor clipId={selectedId} />
        </div>
      )}
    </div>
  );
}
