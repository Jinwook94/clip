// client/src/App.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBlockStore } from "@/store/blockStore";
import Sidebar from "@/components/Sidebar";
import ClipHome from "@/components/clips/ClipHome";

/**
 * App.tsx
 *  - 최상위 레이아웃 컴포넌트
 *  - 사이드바 표시/숨김 토글
 *  - 오른쪽 메인 영역
 *  - 상단에 언어 선택 드롭다운
 */
function App() {
  // (A) 초기 로딩 상태
  const [init, setInit] = useState(false);

  // (B) 사이드바 열림/접힘
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // (C) blockStore: clips 로딩
  const loadBlocksFromDB = useBlockStore((s) => s.loadBlocksFromDB);

  // (D) i18n 훅
  const { i18n } = useTranslation();

  /**
   * 초기 마운트 시, DB에서 블록을 불러온 뒤 init=true로 전환
   */
  useEffect(() => {
    loadBlocksFromDB().then(() => {
      setInit(true);
    });
  }, [loadBlocksFromDB]);

  /**
   * 언어 변경 함수
   *  - 프론트 i18n + 메인프로세스 locale 동기화
   */
  const handleChangeLanguage = async (lang: string) => {
    // 1) React i18n
    await i18n.changeLanguage(lang);
    // 2) Electron Main
    await window.ipcRenderer.invoke("set-language", lang);
  };

  /**
   * 아직 블록 로딩이 안 끝났다면 로딩 메시지
   */
  if (!init) {
    return <div>Loading from DB...</div>;
  }

  return (
    <div
      className="flex h-screen overflow-hidden text-gray-900"
      style={{ backgroundColor: "#FFF" }}
    >
      {/**
       * (E) 왼쪽 사이드바
       *  - isSidebarOpen이 true일 때만 표시
       *  - w-64: 넓이 16rem
       *  - border-r: 오른쪽에 구분선
       */}
      {isSidebarOpen && (
        <div className="w-64 bg-[#F9F9F9] border-r">
          <Sidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/**
       * (F) 오른쪽 메인 영역
       *  - flex-1: 남은 공간 전부 사용
       *  - flex flex-col: 상단/하단 분할
       */}
      <div className="flex-1 flex flex-col">
        {/**
         * (1) 상단 바: 언어 선택 등
         *  - border-b 로 구분
         */}
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

        {/**
         * (2) 메인 내용: ClipHome
         *  - overflow-auto 로 필요시 세로 스크롤
         */}
        <div className="flex-1 overflow-auto p-4">
          <ClipHome
            isSidebarOpen={isSidebarOpen}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
