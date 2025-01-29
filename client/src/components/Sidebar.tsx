import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconFile,
  IconActivity,
  IconTag,
  IconMenu2, // 햄버거 메뉴 스타일 접기 아이콘
  IconSearch,
} from "@tabler/icons-react";
import { useClipStore } from "@/store/clipStore";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex flex-col w-64 h-screen bg-[#F9F9F9] text-gray-900">
      {/* Lv1: 최상단 (접기 버튼) */}
      <div className="flex items-center justify-end p-3">
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-gray-200 rounded-md transition-all"
          onClick={onCloseSidebar}
        >
          <IconMenu2 className="w-5 h-5 text-gray-600" />
        </Button>
      </div>

      {/* Lv2: 검색 필드 */}
      <div className="p-3">
        <div className="relative">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <IconSearch className="absolute left-4 top-2.5 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Lv3: 메인 내비게이션 (Clips / Actions / Snippets) */}
      <div className="p-2">
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconFile className="w-4 h-4 mr-2" /> Clips
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconActivity className="w-4 h-4 mr-2" /> Actions
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconTag className="w-4 h-4 mr-2" /> Snippets
        </div>
      </div>

      {/* Lv4: 즐겨찾기 (Favorites) 복구 */}
      <div className="p-2">
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
                  onClick={() => onSelectClip && onSelectClip(clip.id)}
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

      {/* Lv5: Labels 섹션 복구 */}
      <div className="p-3">
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
