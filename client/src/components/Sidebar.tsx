import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconFile,
  IconActivity,
  IconTag,
  IconMenu2,
  IconSearch,
} from "@tabler/icons-react";
import { useClipStore } from "@/store/clipStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import Titlebar from "./Titlebar";

// 간단 Mac 판별 (원하면 main에서 process.platform="darwin" 넘겨받아도 됨)
const isMac = navigator.userAgent.includes("Mac OS X");

interface SidebarProps {
  onCloseSidebar: () => void;
  onSelectClip?: (clipId: string) => void;
  selectedClipId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onCloseSidebar,
  onSelectClip,
  selectedClipId,
}) => {
  const clips = useClipStore((s) => s.clips);
  const favoriteClips = clips.filter((clip) => clip.isFavorite);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-col w-64 h-screen bg-[#F9F9F9] text-gray-900 relative">
      {" "}
      {/* relative 추가 */}
      {/* (1) 최상단 영역 */}
      <div className="relative h-14 drag-region flex items-center">
        {/* Windows/Linux 전용 커스텀 버튼 */}
        {!isMac && (
          <div className="no-drag-region flex items-center">
            <Titlebar />
          </div>
        )}

        {/* 우측: 사이드바 접기 버튼 (햄버거) */}
        <div className="absolute right-0 top-0 no-drag-region flex items-center h-14 px-3">
          <Button
            variant="ghost"
            size="lg"
            className="hover:bg-gray-200 rounded-md transition-all"
            onClick={onCloseSidebar}
          >
            <IconMenu2 className="w-7 h-7 text-gray-600" />
          </Button>
        </div>
      </div>
      {/*
        (2) 검색 필드 - 아이콘도 조금 키우려면 w-5 h-5 → w-6 h-6 등 가능
      */}
      <div className="px-4 py-3">
        <div className="relative">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
          <IconSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
        </div>
      </div>
      {/*
        (3) 메인 내비게이션
      */}
      <div className="px-2 pb-2">
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconFile className="w-5 h-5 mr-2" /> Clips
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconActivity className="w-5 h-5 mr-2" /> Actions
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconTag className="w-5 h-5 mr-2" /> Snippets
        </div>
      </div>
      {/*
        (4) 즐겨찾기(Favorites)
      */}
      <div className="px-2 pb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Favorites
        </div>
        <ScrollArea className="max-h-40">
          {favoriteClips.length > 0 ? (
            favoriteClips.map((clip) => {
              const isSelected = clip.id === selectedClipId;
              return (
                <div
                  key={clip.id}
                  onClick={() => onSelectClip?.(clip.id)}
                  className={`p-2 mb-1 rounded-md cursor-pointer ${
                    isSelected ? "bg-gray-300" : "hover:bg-[#ECECEC]"
                  }`}
                >
                  {clip.name}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-500 italic p-2">
              No favorites yet.
            </p>
          )}
        </ScrollArea>
      </div>
      {/*
        (5) Labels
      */}
      <div className="px-3 py-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Labels
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
            Frontend
          </span>
          <span className="px-2 py-1 text-xs bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
            Backend
          </span>
          <span className="px-2 py-1 text-xs bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
            Bug Fixes
          </span>
          <span className="px-2 py-1 text-xs bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
            Refactor
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
