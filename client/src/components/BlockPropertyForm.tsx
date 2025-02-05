import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import FileSelectionModal from "./FileSelectionModal";
import { toast } from "@/hooks/use-toast";
import { IconX, IconCode } from "@tabler/icons-react";
import { useBlockStore } from "@/store/blockStore";
import IntelliJCodeEditor from "./IntelliJCodeEditor";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * 블록 타입과 속성을 저장할 폼 데이터
 */
export interface BlockFormData {
  type: string;
  properties: Record<string, unknown>;
}

interface BlockPropertyFormProps {
  blockType: string;
  properties: Record<string, unknown>;
  onChange: (newType: string, newProps: Record<string, unknown>) => void;
  disableTypeSelection?: boolean;
}

function shortenPath(pathStr: string, maxDepth: number = 5): string {
  const segments = pathStr.split(/[\\/]+/);
  if (segments.length <= maxDepth) return pathStr;
  const frontCount = Math.ceil(maxDepth / 2);
  const backCount = Math.floor(maxDepth / 2);
  const front = segments.slice(0, frontCount).join("/");
  const back = segments.slice(segments.length - backCount).join("/");
  return `${front}/.../${back}`;
}

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

  const [localType, setLocalType] = useState(blockType);
  const [localProps, setLocalProps] = useState({ ...properties });

  // clip 블록 shortcut
  const [shortcut, setShortcut] = useState<string>(
    (localProps.shortcut as string) || "",
  );

  // file_path 블록용 파일선택 모달
  const [fileModalOpen, setFileModalOpen] = useState(false);

  // action 블록용 Code 편집 Sheet
  const [codeSheetOpen, setCodeSheetOpen] = useState(false);
  const [tempCode, setTempCode] = useState<string>(
    (localProps.code as string) ?? "",
  );

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

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setLocalType(newType);
    onChange(newType, localProps);
  };

  const updateProp = (key: string, value: unknown) => {
    const merged = { ...localProps, [key]: value };
    setLocalProps(merged);
    onChange(localType, merged);
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    let combo = "";
    if (e.ctrlKey) combo += "Ctrl+";
    if (e.shiftKey) combo += "Shift+";
    if (e.altKey) combo += "Alt+";
    if (e.metaKey) combo += "Cmd+";
    combo += e.key.toUpperCase();
    setShortcut(combo);
    updateProp("shortcut", combo);
  };

  const availableBlockTypes = Array.from(
    new Set(allBlocks.map((b) => b.type)),
  ).filter((type) => type !== "clip" && type !== "action");

  return (
    <div className="space-y-2">
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
            <option value="snippet">snippet</option>
          </select>
        </div>
      )}

      {/* clip shortcut */}
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

      {/* action block: requiredBlocks + code */}
      {localType === "action" && (
        <div className="space-y-2">
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
              <span className="text-xs text-gray-500">
                {tempCode.length} chars
              </span>
            </div>

            {/* Sheet */}
            <Sheet open={codeSheetOpen} onOpenChange={setCodeSheetOpen}>
              <SheetContent side="right" className="overflow-auto">
                <SheetHeader>
                  <SheetTitle>Action Code</SheetTitle>
                  <SheetDescription>
                    {t("CODE_OPTIONAL")} - {t("EDIT_BLOCK")}
                  </SheetDescription>
                </SheetHeader>

                {/**
                 * (★ 변경된 부분) IntelliJCodeEditor 로 대체
                 */}
                <div className="mt-4 flex-1" style={{ minHeight: "400px" }}>
                  <IntelliJCodeEditor
                    value={tempCode}
                    onChange={(newVal) => setTempCode(newVal)}
                    height="calc(100vh - 220px)" // 시트 크기에 맞춰 대략 조정
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

      {/* file_path */}
      {localType === "file_path" && (
        <div className="space-y-2">
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
                        (x) => x !== p,
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

      {/* snippet: 텍스트 스니펫 입력 */}
      {localType === "snippet" && (
        <div>
          <label className="block font-semibold mb-1">
            {t("SNIPPET_TEXT") || "Snippet Text"}:
          </label>
          <textarea
            value={(localProps.text as string) || ""}
            onChange={(e) => updateProp("text", e.target.value)}
            className="border p-1 w-full"
            rows={5}
          />
        </div>
      )}
    </div>
  );
}
