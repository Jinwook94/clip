import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ClipHome from "@/components/clips/ClipHome";
import Sidebar from "@/components/Sidebar";
import { useClipStore } from "@/store/clipStore";
import ClipCreateForm from "@/components/clips/ClipCreateForm";

function App() {
  const [init, setInit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const loadClipsFromDB = useClipStore((s) => s.loadClipsFromDB);

  // i18n
  const { t, i18n } = useTranslation();

  // 사이드바에서 "새 클립 만들기"
  const handleCreateNewClip = () => {
    setShowForm(true);
  };

  // 사이드바에서 clip 클릭
  const handleSelectClip = (clipId: string) => {
    setEditingId(clipId);
  };

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

  // 언어 변경
  const handleChangeLanguage = async (lang: string) => {
    // React i18n 변경
    await i18n.changeLanguage(lang);
    // 메인 프로세스(locale) 변경
    await window.ipcRenderer.invoke("set-language", lang);
  };

  if (!init) {
    return <div>Loading from DB...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* 왼쪽 사이드바 */}
      {isSidebarOpen && (
        <Sidebar
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onCreateNewClip={handleCreateNewClip}
          onSelectClip={handleSelectClip}
          selectedClipId={editingId ?? undefined}
        />
      )}

      {/* 메인 영역 */}
      <div className="flex-1 p-4 overflow-auto">
        {/* 언어 선택 드롭다운 */}
        <div className="flex justify-end mb-2">
          <select
            value={i18n.language}
            onChange={(e) => handleChangeLanguage(e.target.value)}
            className="border p-1"
          >
            {/* 기존 언어 */}
            <option value="en">English</option>
            <option value="ko">한국어</option>
            <option value="zh">中文(简体)</option>
            <option value="zh-TW">中文(繁體)</option>
            <option value="es">Español</option>
            <option value="ar">العربية</option>

            {/* 새로 추가된 언어 */}
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="ja">日本語</option>
            <option value="ru">Русский</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        <ClipHome
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {showForm && (
          <div className="mb-4 border p-4 rounded bg-white text-black">
            <ClipCreateForm onClose={() => setShowForm(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
