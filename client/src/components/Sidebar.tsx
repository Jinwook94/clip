import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconFile,
  IconActivity,
  IconTag,
  IconMenu2,
  IconSearch,
  IconStar,
  IconStarFilled,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { useClipStore } from "@/store/clipStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import Titlebar from "./Titlebar";

const isMac = navigator.userAgent.includes("Mac OS X");

interface SidebarProps {
  onCloseSidebar: () => void;
  onCreateNewClip?: () => void; // 사이드바에서 새 클립 생성 버튼(옵션)
  onSelectClip?: (clipId: string) => void;
  selectedClipId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onCloseSidebar,
  onCreateNewClip,
  onSelectClip,
  selectedClipId,
}) => {
  const clips = useClipStore((s) => s.clips);
  const [searchTerm, setSearchTerm] = useState("");

  // 楽: "isFavorite === true" 만 필터
  const favoriteClips = clips.filter((clip) => clip.isFavorite);

  // 5개 이하까지만 표시
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);

  const toggleFavoritesExpand = () => {
    setFavoritesExpanded(!favoritesExpanded);
  };

  const visibleFavorites = favoritesExpanded
    ? favoriteClips
    : favoriteClips.slice(0, 5);

  return (
    <div className="flex flex-col w-64 h-screen bg-[#F9F9F9] text-gray-900 relative">
      {/* (1) 최상단 영역 */}
      <div className="relative h-14 drag-region flex items-center">
        {/* Windows/Linux 전용 커스텀 버튼 */}
        {!isMac && (
          <div className="no-drag-region flex items-center">
            <Titlebar />
          </div>
        )}

        {/* 우측: 사이드바 접기 버튼 */}
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

      {/* (2) 검색 필드 */}
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

      {/* (3) 메인 내비게이션 */}
      <div className="px-2 pb-2">
        <div
          className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md"
          // 예시로 어디선가 clip 목록 보여주는 탭 이동
        >
          <IconFile className="w-5 h-5 mr-2" /> Clips
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconActivity className="w-5 h-5 mr-2" /> Actions
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconTag className="w-5 h-5 mr-2" /> Snippets
        </div>
      </div>

      {/* (4) Favorites */}
      <div className="px-2 pb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Favorites
        </div>
        <ScrollArea className="max-h-40">
          {favoriteClips.length > 0 ? (
            <>
              {visibleFavorites.map((clip) => {
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
              })}

              {/* 6개 이상인 경우, 펼치기/접기 */}
              {favoriteClips.length > 5 && (
                <div
                  className="flex items-center text-sm text-blue-500 cursor-pointer ml-2"
                  onClick={toggleFavoritesExpand}
                >
                  {favoritesExpanded ? (
                    <>
                      <IconChevronDown className="w-4 h-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <IconChevronRight className="w-4 h-4 mr-1" />
                      {favoriteClips.length - 5} more
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500 italic p-2">
              No favorites yet.
            </p>
          )}
        </ScrollArea>
      </div>

      {/* (5) Labels */}
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
