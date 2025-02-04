import React, { useState, useEffect } from "react";
import { IpcRendererEvent } from "electron";
import { useTranslation } from "react-i18next";
import { useBlockStore } from "@/store/blockStore";
import Sidebar from "@/components/Sidebar";
import ClipHome from "@/components/clips/ClipHome";
import BlockTypesPage from "@/components/BlockTypesPage";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

function App() {
  // 초기 로딩 상태
  const [init, setInit] = useState(false);
  // 사이드바 열림/접힘 상태
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // 내비게이션 상태: "clips" (기본) 또는 "blockTypes" 등
  const [page, setPage] = useState("clips");
  const loadBlocksFromDB = useBlockStore((s) => s.loadBlocksFromDB);
  const { i18n } = useTranslation();

  useEffect(() => {
    loadBlocksFromDB().then(() => {
      setInit(true);
    });
    function handleClipRunDone(
      _evt: IpcRendererEvent,
      payload: { error: boolean; message: string },
    ) {
      if (payload.error) {
        toast({
          variant: "destructive",
          title: "Run Error",
          description: payload.message,
        });
      } else {
        toast({
          title: "Success",
          description: payload.message,
        });
      }
    }
    window.ipcRenderer.on("clip-run-done", handleClipRunDone);
    return () => {
      window.ipcRenderer.off("clip-run-done", handleClipRunDone);
    };
  }, [loadBlocksFromDB]);

  const handleChangeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await window.ipcRenderer.invoke("set-language", lang);
  };

  const handleNavigate = (pageName: string) => {
    setPage(pageName);
  };

  if (!init) {
    return <div>Loading from DB...</div>;
  }

  return (
    <>
      <Toaster />
      <div
        className="flex h-screen overflow-hidden text-gray-900"
        style={{ backgroundColor: "#FFF" }}
      >
        {isSidebarOpen && (
          <div className="w-64 bg-[#F9F9F9] border-r">
            <Sidebar
              onCloseSidebar={() => setIsSidebarOpen(false)}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="flex justify-end p-2 border-b">
            <select
              className="border p-1 text-sm"
              value={i18n.language}
              onChange={(e) => handleChangeLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="ko">한국어</option>
              <option value="zh">中文(简体)</option>
              <option value="zh-TW">中文(繁體)</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="ja">日本語</option>
              <option value="ru">Русский</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {page === "clips" && (
              <ClipHome
                isSidebarOpen={isSidebarOpen}
                onOpenSidebar={() => setIsSidebarOpen(true)}
              />
            )}
            {page === "blockTypes" && <BlockTypesPage />}
            {/* 필요에 따라 다른 페이지도 추가 */}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
