import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconMenu2 } from "@tabler/icons-react";
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
import { useTranslation } from "react-i18next";

interface ClipHomeProps {
  onOpenSidebar: () => void;
  isSidebarOpen: boolean;
}

function ClipHome({ onOpenSidebar, isSidebarOpen }: ClipHomeProps) {
  const { t } = useTranslation();
  const clips = useClipStore((s) => s.clips);
  const removeClip = useClipStore((s) => s.removeClip);
  const updateClip = useClipStore((s) => s.updateClip);
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

  // Favorite 토글
  const handleToggleFavorite = async (clipId: string) => {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) return;
    await updateClip(clipId, { isFavorite: !clip.isFavorite });
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* 상단바 */}
      <div className="flex items-center justify-between mb-4 h-10 drag-region px-2">
        {/* 사이드바 열기 버튼 */}
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

        {/* 우측: Create Clip 버튼 */}
        <div className="flex items-center gap-2 no-drag-region">
          {/* 하드코딩되었던 "My Clips" → t("MY_CLIPS") */}
          <h1 className="text-xl font-bold">{t("MY_CLIPS")}</h1>
          <Button variant="outline" onClick={() => setShowForm(true)}>
            {/* "Create Clip" → t("CREATE_CLIP") */}
            <Plus className="mr-1 w-4 h-4" /> {t("CREATE_CLIP")}
          </Button>
        </div>
      </div>

      {/* 메인 내용 */}
      <div className="flex-1 overflow-auto px-4">
        {showForm && <ClipCreateForm onClose={() => setShowForm(false)} />}

        {clips.length === 0 ? (
          // 예시: "No Clips yet. Please create one!"
          <p>{t("NO_CLIPS_YET") || "No Clips yet. Please create one!"}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {clips.map((clip) => (
              <Card
                key={clip.id}
                className="relative hover:shadow cursor-pointer"
                onClick={() => handleRunClip(clip.id)}
              >
                <CardHeader>
                  {/* clip.name → 굳이 번역 key가 아니라, 사용자가 작성한 텍스트이므로 그대로 표시 */}
                  <CardTitle>{clip.name}</CardTitle>
                  {/* Action: copy → 하드코딩된 부분도 t("ACTION") + clip.actionType 가능. 
                      하지만 "copy/txtExtract"는 번역이 애매할 수도 있음. */}
                  <CardDescription>
                    {t("ACTION")}: {clip.actionType}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    {t("ROOT")}: {clip.projectRoot}
                  </p>
                  {clip.selectedPaths.length > 0 && (
                    <p>{clip.selectedPaths.length} files selected</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {t("CREATED")}: {clip.createdAt}
                    <br />
                    {t("UPDATED")}: {clip.updatedAt}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {/* Edit 버튼: t("EDIT") */}
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

                  {/* Delete 버튼: t("DELETE") */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${clip.name}"?`)) {
                        removeClip(clip.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* Favorite: t("FAVORITE") / t("UNFAVORITE") */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(clip.id);
                    }}
                  >
                    {clip.isFavorite ? (
                      <Star className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <StarOff className="w-4 h-4 text-gray-400" />
                    )}
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
                {t("CLOSE_EDITOR") || "Close"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClipHome;
