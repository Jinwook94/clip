import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconMenu2 } from "@tabler/icons-react"; // 사이드바 열기 아이콘
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import ClipCreateForm from "./ClipCreateForm";
import ClipEditor from "./ClipEditor";
import { useClipStore } from "@/store/clipStore";
import { ensureClipRunDoneListener } from "@/lib/ipcRendererOnce";

interface ClipHomeProps {
  onOpenSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function ClipHome({
  onOpenSidebar,
  isSidebarOpen,
}: ClipHomeProps) {
  const clips = useClipStore((s) => s.clips);
  const removeClip = useClipStore((s) => s.removeClip);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    ensureClipRunDoneListener();
  }, []);

  // Clip 실행
  const handleRunClip = (clipId: string) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;
    window.ipcRenderer.send("clip-run", clip);
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* (1) 상단바: h-10, drag-region, ClipHome와 Sidebar 동일 높이로 맞춤 */}
      <div className="flex items-center justify-between mb-4 h-10 drag-region px-2">
        {/* 사이드바가 닫혀있을 때만 열기버튼(클릭은 no-drag-region) */}
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="no-drag-region mr-2"
            onClick={onOpenSidebar}
          >
            <IconMenu2 className="w-5 h-5" />
          </Button>
        )}

        {/* 우측: Create Clip 버튼도 no-drag-region 처리 */}
        <div className="flex items-center gap-2 no-drag-region">
          <h1 className="text-xl font-bold">My Clips</h1>
          <Button variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 w-4 h-4" /> Create Clip
          </Button>
        </div>
      </div>

      {/* (2) 메인 내용 영역 */}
      <div className="flex-1 overflow-auto px-4">
        {/* Create Clip 폼 */}
        {showForm && <ClipCreateForm onClose={() => setShowForm(false)} />}

        {clips.length === 0 ? (
          <p>No Clips yet. Please create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {clips.map((clip) => (
              <Card
                key={clip.id}
                className="relative cursor-pointer hover:shadow"
                onClick={() => handleRunClip(clip.id)}
              >
                <CardHeader>
                  <CardTitle>{clip.name}</CardTitle>
                  <CardDescription>Action: {clip.actionType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Root: {clip.projectRoot}</p>
                  {clip.selectedPaths.length > 0 && (
                    <p>{clip.selectedPaths.length} files selected</p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  {/* 편집 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(clip.id);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  {/* 삭제 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          `Are you sure you want to delete "${clip.name}"?`,
                        )
                      ) {
                        removeClip(clip.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Clip 편집 모드 */}
        {editingId && (
          <div className="p-4 mb-4 border rounded">
            <ClipEditor clipId={editingId} />
            <div className="mt-2 flex justify-end">
              <Button variant="ghost" onClick={() => setEditingId(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
