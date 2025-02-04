import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import FileSelectionModal from "./FileSelectionModal";
import { toast } from "@/hooks/use-toast";
import { IconX, IconCode } from "@tabler/icons-react";
import { useBlockStore } from "@/store/blockStore";


/**
 * 블록 타입과 속성을 저장할 폼 데이터 인터페이스
 */
export interface BlockFormData {
  type: string;
  properties: Record<string, unknown>;
}

/**
 * 컴포넌트의 props 인터페이스
 */
interface BlockPropertyFormProps {
  blockType: string;
  properties: Record<string, unknown>;
  onChange: (newType: string, newProps: Record<string, unknown>) => void;
  /**
   * clip 블록인 경우 등, block 타입 선택 영역을 숨길지 여부
   */
  disableTypeSelection?: boolean;
}

/**
 * 경로를 세그먼트(depth) 기준으로 단축하여 표시하는 함수
 */
function shortenPath(pathStr: string, maxDepth: number = 5): string {
  const segments = pathStr.split(/[\\/]+/);
  if (segments.length <= maxDepth) return pathStr;
  const frontCount = Math.ceil(maxDepth / 2);
  const backCount = Math.floor(maxDepth / 2);
  const front = segments.slice(0, frontCount).join("/");
  const back = segments.slice(segments.length - backCount).join("/");
  return `${front}/.../${back}`;
}

/**
 * rootPath 기준 상대경로를 계산하는 함수
 */
function relativePath(fullPath: string, rootPath: string): string {
  if (fullPath.startsWith(rootPath)) {
    let rel = fullPath.substring(rootPath.length);
    if (rel.startsWith("/") || rel.startsWith("\\")) {
      rel = rel.substring(1);
    }
    return rel;
  }
  return fullPath;
}

export default function BlockPropertyForm({
  blockType,
  properties,
  onChange,
  disableTypeSelection = false,
}: BlockPropertyFormProps) {
  const { t } = useTranslation();
  const allBlocks = useBlockStore((state) => state.blocks);

  // (A) 로컬 스테이트
  const [localType, setLocalType] = useState(blockType);
  const [localProps, setLocalProps] = useState({ ...properties });

  // (B) clip 블록에서 shortcut 상태
  const [shortcut, setShortcut] = useState<string>(
    (localProps.shortcut as string) || "",
  );

  // (C) file_path 블록에서 파일 선택 모달
  const [fileModalOpen, setFileModalOpen] = useState(false);

  // (D) action 블록의 Code 편집 시트 열림/닫힘 상태
  const [codeSheetOpen, setCodeSheetOpen] = useState(false);

  // (E) action 블록의 코드 임시 저장
  const [tempCode, setTempCode] = useState<string>(
    (localProps.code as string) ?? "",
  );

  /**
   * props 바뀔 때마다 로컬 스테이트 초기화
   */
  useEffect(() => {
    setLocalType(blockType);
    setLocalProps({ ...properties });

    if (blockType === "clip" && properties.shortcut) {
      setShortcut(properties.shortcut as string);
    }
    if (blockType === "action" && properties.code) {
      setTempCode(properties.code as string);
    }
  }, [blockType, properties]);

  /**
   * 블록 타입 변경 핸들러
   */
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setLocalType(newType);
    onChange(newType, localProps);
  };

  /**
   * 속성 변경 핸들러
   */
  const updateProp = (key: string, value: unknown) => {
    const merged = { ...localProps, [key]: value };
    setLocalProps(merged);
    onChange(localType, merged);
  };

  /**
   * Shortcut 입력 시 키 조합을 기록
   */
  const handleShortcutKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault(); // 기본 동작 방지
    let combo = "";
    if (e.ctrlKey) combo += "Ctrl+";
    if (e.shiftKey) combo += "Shift+";
    if (e.altKey) combo += "Alt+";
    if (e.metaKey) combo += "Cmd+";
    combo += e.key.toUpperCase();
    setShortcut(combo);
    updateProp("shortcut", combo);
  };

  /**
   * action 타입 블록의 경우, 사용 가능한 블록 타입 목록
   * (예: clip, action 제외한 나머지 type을 requiredBlockTypes로 설정 가능)
   */
  const availableBlockTypes = Array.from(
    new Set(allBlocks.map((b) => b.type)),
  ).filter((type) => type !== "clip" && type !== "action");

  return (
    <div className="space-y-2">
      {/* (1) 블록 타입 선택. 단, disableTypeSelection=true일 땐 숨김 */}
      {!disableTypeSelection && (
        <div>
          <label className="block font-semibold mb-1">{t("BLOCK_TYPE")}:</label>
          <select
            className="border p-1 w-full"
            value={localType}
            onChange={handleTypeChange}
          >
            <option value="clip">clip</option>
            <option value="action">action</option>
            <option value="file_path">file path</option>
          </select>
        </div>
      )}

      {/* (2) Name 속성 */}
      <div>
        <label className="block font-semibold mb-1">{t("NAME")}:</label>
        <Input
          value={(localProps.name as string) ?? ""}
          onChange={(e) => updateProp("name", e.target.value)}
        />
      </div>

      {/* (3) clip 블록: Shortcut 입력 */}
      {localType === "clip" && (
        <div className="space-y-2">
          <div>
            <label className="block font-semibold mb-1">Shortcut:</label>
            <input
              type="text"
              placeholder="Press shortcut keys"
              value={shortcut}
              onKeyDown={handleShortcutKeyDown}
              onChange={() => {}}
              className="border p-1 w-full"
            />
          </div>
        </div>
      )}

      {/* (4) action 블록: REQUIRED_BLOCKS + Code 편집 버튼 + 우측 Sheet */}
      {localType === "action" && (
        <div className="space-y-2">
          {/* (4-1) REQUIRED_BLOCKS */}
          <div>
            <label className="block font-semibold mb-1">
              {t("REQUIRED_BLOCKS")}
            </label>
            <select
              multiple
              className="border p-1 w-full h-24"
              value={
                Array.isArray(localProps.requiredBlockTypes)
                  ? (localProps.requiredBlockTypes as string[])
                  : []
              }
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(
                  (opt) => opt.value,
                );
                updateProp("requiredBlockTypes", selected);
              }}
            >
              {availableBlockTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <small className="text-gray-500">
              (Hold Ctrl or Shift to select multiple)
            </small>
          </div>

          {/* (4-2) Code는 별도 Sheet에서 편집 */}
          <div>
            <label className="block font-semibold mb-1">
              {t("CODE_OPTIONAL")}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => setCodeSheetOpen(true)}
              >
                <IconCode className="w-4 h-4" />
                <span>Edit Code</span>
              </Button>
              {/* 현재 코드 상태를 간단히 미리보기(길이)로 표시 */}
              <span className="text-xs text-gray-500">
                {tempCode.length} chars
              </span>
            </div>

            {/* Sheet(우측 슬라이드) 영역 */}
            <Sheet open={codeSheetOpen} onOpenChange={setCodeSheetOpen}>
              {/* SheetTrigger를 여기선 안 씀. 수동으로 onOpenChange */}
              <SheetContent side="right" className="overflow-auto">
                <SheetHeader>
                  <SheetTitle>Action Code</SheetTitle>
                  <SheetDescription>
                    {t("CODE_OPTIONAL")} - {t("EDIT_BLOCK")}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-4 flex-1">
                  <textarea
                    className="w-full h-[70vh] border p-2 text-sm font-jetbrains"
                    value={tempCode}
                    onChange={(e) => setTempCode(e.target.value)}
                  />
                </div>

                <SheetFooter className="mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setCodeSheetOpen(false)}
                  >
                    {t("CANCEL")}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      // Sheet를 닫으면서 최종 코드 반영
                      updateProp("code", tempCode);
                      setCodeSheetOpen(false);
                    }}
                  >
                    {t("UPDATE")}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* (5) file_path 블록: 파일(디렉토리) 선택 UI */}
      {localType === "file_path" && (
        <div className="space-y-2">
          {/* (5-1) Root Path 선택 */}
          <div>
            <label className="block font-semibold mb-1">Root Path:</label>
            <div className="flex items-center">
              <Input
                readOnly
                placeholder="Select Root"
                value={
                  typeof localProps.rootPath === "string" && localProps.rootPath
                    ? shortenPath(localProps.rootPath as string)
                    : ""
                }
                onClick={() => {
                  window.ipcRenderer
                    .invoke("show-directory-dialog")
                    .then((root: string | null) => {
                      if (root) {
                        updateProp("rootPath", root);
                      }
                    });
                }}
              />
              {typeof localProps.rootPath === "string" &&
                localProps.rootPath && (
                  <button
                    className="ml-2 p-1 border rounded"
                    onClick={() => {
                      updateProp("rootPath", "");
                      updateProp("paths", []);
                    }}
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                )}
            </div>
          </div>

          {/* (5-2) File Paths 선택 */}
          <div>
            <label className="block font-semibold mb-1">File Paths:</label>
            <button
              className="border p-2 rounded"
              onClick={() => {
                if (!localProps.rootPath) {
                  toast({ description: "Please select a Root Path first." });
                  return;
                }
                setFileModalOpen(true);
              }}
            >
              Select Files/Directories
            </button>
          </div>

          {/* (5-3) 선택된 경로들 목록 */}
          <div className="flex flex-wrap gap-2">
            {Array.isArray(localProps.paths) && localProps.paths.length > 0 ? (
              (localProps.paths as string[]).map((p) => (
                <div
                  key={p}
                  className="flex items-center bg-gray-200 rounded px-2 py-1"
                >
                  <span>
                    {localProps.rootPath
                      ? relativePath(p, localProps.rootPath as string)
                      : p}
                  </span>
                  <button
                    className="ml-1"
                    onClick={() => {
                      const newPaths = (localProps.paths as string[]).filter(
                        (path) => path !== p,
                      );
                      updateProp("paths", newPaths);
                    }}
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <span className="text-sm">All</span>
            )}
          </div>

          {/* (5-4) FileSelectionModal */}
          {fileModalOpen && (
            <FileSelectionModal
              open={fileModalOpen}
              initialRoot={localProps.rootPath as string}
              initialSelected={localProps.paths as string[]}
              onClose={() => setFileModalOpen(false)}
              onConfirm={(paths) => {
                updateProp("paths", paths);
                setFileModalOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
