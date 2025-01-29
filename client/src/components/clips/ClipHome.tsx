import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconMenu2 } from "@tabler/icons-react"; // 사이드바 열기 버튼 아이콘
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
  const [showForm, setShowForm] = useState(false); // ✅ Create Clip 상태 추가
  const [editingId, setEditingId] = useState<string | null>(null);

  // Clip 실행 함수
  const handleRunClip = (clipId: string) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;
    window.ipcRenderer.send("clip-run", clip); // ✅ clip-run 실행
  };

  // clip-run 결과 알림 (중복 등록 방지)
  useEffect(() => {
    ensureClipRunDoneListener();
  }, []);

  return (
    <div className="p-4">
      {/* 사이드바가 닫혀 있을 때만 표시되는 버튼 */}
      {!isSidebarOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={onOpenSidebar}
        >
          <IconMenu2 className="w-5 h-5" />
        </Button>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My Clips</h1>
        <Button variant="outline" onClick={() => setShowForm(true)}>
          {" "}
          {/* ✅ Create Clip 버튼 복구 */}
          <Plus className="mr-1 w-4 h-4" /> Create Clip
        </Button>
      </div>

      {/* ✅ Create Clip 폼 표시 */}
      {showForm && (
        <ClipCreateForm
          onClose={() => setShowForm(false)} // 폼 닫기 기능 추가
        />
      )}

      {clips.length === 0 ? (
        <p>No Clips yet. Please create one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {clips.map((clip) => (
            <Card
              key={clip.id}
              className="relative cursor-pointer hover:shadow"
              onClick={() => handleRunClip(clip.id)} // ✅ Clip 클릭 시 실행
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
                {/* Edit 버튼 (편집 모드 활성화) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ 부모 클릭 이벤트 방지
                    setEditingId(clip.id);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>

                {/* Delete 버튼 (삭제 확인 추가) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ 부모 클릭 이벤트 방지
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
  );
}
