import { useState, useEffect } from "react";
import ClipHome from "@/components/clips/ClipHome";
import Sidebar from "@/components/Sidebar";
import { useClipStore } from "@/store/clipStore";
import ClipCreateForm from "@/components/clips/ClipCreateForm";

function App() {
  const [init, setInit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 사이드바 상태 추가
  const loadClipsFromDB = useClipStore((s) => s.loadClipsFromDB);

  // 사이드바에서 "새 클립 만들기" 버튼을 누르면
  const handleCreateNewClip = () => {
    setShowForm(true);
  };

  // 사이드바에서 clip 항목을 클릭했을 때
  const handleSelectClip = (clipId: string) => {
    setEditingId(clipId);
  };

  // 예: 글로벌 단축키 메시지
  useEffect(() => {
    const handler = (_evt: any, data: any) => {
      console.log("[shortcut-triggered]", data);
    };
    window.ipcRenderer.on("shortcut-triggered", handler);
    return () => {
      window.ipcRenderer.off("shortcut-triggered", handler);
    };
  }, []);

  useEffect(() => {
    loadClipsFromDB().then(() => {
      setInit(true);
    });
  }, [loadClipsFromDB]);

  if (!init) {
    return <div>Loading from DB...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* 왼쪽 사이드바 (isSidebarOpen 상태에 따라 표시) */}
      {isSidebarOpen && (
        <Sidebar
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onCreateNewClip={handleCreateNewClip}
          onSelectClip={handleSelectClip}
          selectedClipId={editingId ?? undefined}
        />
      )}

      {/* 오른쪽 메인 영역 */}
      <div className="flex-1 p-4 overflow-auto">
        {/* ClipHome에 사이드바 다시 열기 기능 추가 */}
        <ClipHome
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* 새 클립 생성 폼 표시 */}
        {showForm && (
          <div className="mb-4 border p-4 rounded bg-white text-black">
            <ClipCreateForm onClose={() => setShowForm(false)} />
          </div>
        )}

        {/* 편집 중인 clip이 있으면 ClipEditor 등 표시 가능 */}
        {/* 현재 예시로 ClipHome을 그대로 유지 */}
      </div>
    </div>
  );
}

export default App;
