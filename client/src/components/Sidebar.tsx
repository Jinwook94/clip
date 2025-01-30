import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconFile,
  IconActivity,
  IconTag,
  IconMenu2,
  IconSearch,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { useClipStore } from "@/store/clipStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import Titlebar from "./Titlebar";
import { useTranslation } from "react-i18next";

const isMac = navigator.userAgent.includes("Mac OS X");

interface SidebarProps {
  onCloseSidebar: () => void;
  onCreateNewClip?: () => void;
  onSelectClip?: (clipId: string) => void;
  selectedClipId?: string;
}

function Sidebar({
  onCloseSidebar,
  onSelectClip,
  selectedClipId,
}: SidebarProps) {
  const { t } = useTranslation();
  const clips = useClipStore((s) => s.clips);
  const [searchTerm, setSearchTerm] = useState("");
  const favoriteClips = clips.filter((clip) => clip.isFavorite);
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);

  const toggleFavoritesExpand = () => {
    setFavoritesExpanded(!favoritesExpanded);
  };
  const visibleFavorites = favoritesExpanded
    ? favoriteClips
    : favoriteClips.slice(0, 5);

  return (
    <div className="flex flex-col w-64 h-screen bg-[#F9F9F9] text-gray-900 relative">
      {/* 최상단 Titlebar (맥외 OS용) */}
      <div className="relative h-14 drag-region flex items-center">
        {!isMac && (
          <div className="no-drag-region flex items-center">
            <Titlebar />
          </div>
        )}

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

      {/* 검색 영역 */}
      <div className="px-4 py-3">
        <div className="relative">
          <Input
            placeholder={t("SEARCH_PLACEHOLDER") || "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
          <IconSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* 메인 Nav */}
      <div className="px-2 pb-2">
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconFile className="w-5 h-5 mr-2" />
          {t("CLIPS_MENU")}
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconActivity className="w-5 h-5 mr-2" />
          {t("ACTIONS_MENU")}
        </div>
        <div className="flex items-center p-2 text-gray-600 cursor-pointer hover:bg-[#ECECEC] rounded-md">
          <IconTag className="w-5 h-5 mr-2" />
          {t("SNIPPETS_MENU")}
        </div>
      </div>

      {/* Favorites */}
      <div className="px-2 pb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          {t("FAVORITES_HEADER")}
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

              {favoriteClips.length > 5 && (
                <div
                  className="flex items-center text-sm text-blue-500 cursor-pointer ml-2"
                  onClick={toggleFavoritesExpand}
                >
                  {favoritesExpanded ? (
                    <>
                      <IconChevronDown className="w-4 h-4 mr-1" />
                      {t("HIDE_FAVORITES") || "Hide"}
                    </>
                  ) : (
                    <>
                      <IconChevronRight className="w-4 h-4 mr-1" />
                      {favoriteClips.length - 5} {t("MORE_FAVORITES") || "more"}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500 italic p-2">
              {t("NO_FAVORITES") || "No favorites yet."}
            </p>
          )}
        </ScrollArea>
      </div>

      {/* Labels (하드코딩 예시) */}
      <div className="px-3 py-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          {t("LABELS_HEADER")}
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
}

export default Sidebar;
