import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import FileSelectionModal from "./FileSelectionModal";
import { toast } from "@/hooks/use-toast";
import { IconX } from "@tabler/icons-react";
import { useBlockStore } from "@/store/blockStore";

// 블록 타입과 속성을 저장할 폼 데이터 인터페이스
export interface BlockFormData {
  type: string;
  properties: Record<string, unknown>;
}

// 컴포넌트의 props 인터페이스
interface BlockPropertyFormProps {
  blockType: string;
  properties: Record<string, unknown>;
  onChange: (newType: string, newProps: Record<string, unknown>) => void;
}

// 경로를 세그먼트(depth) 기준으로 단축하여 표시하는 함수
function shortenPath(pathStr: string, maxDepth: number = 5): string {
  const segments = pathStr.split(/[\\/]+/);
  if (segments.length <= maxDepth) return pathStr;
  const frontCount = Math.ceil(maxDepth / 2);
  const backCount = Math.floor(maxDepth / 2);
  const front = segments.slice(0, frontCount).join("/");
  const back = segments.slice(segments.length - backCount).join("/");
  return `${front}/.../${back}`;
}

// rootPath 기준 상대경로를 계산하는 함수
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
}: BlockPropertyFormProps) {
  const { t } = useTranslation();
  const [localType, setLocalType] = useState(blockType);
  const [localProps, setLocalProps] = useState({ ...properties });
  const [fileModalOpen, setFileModalOpen] = useState(false);

  useEffect(() => {
    setLocalType(blockType);
    setLocalProps({ ...properties });
  }, [blockType, properties]);

  // 타입 변경 핸들러
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setLocalType(newType);
    onChange(newType, localProps);
  };

  // 속성 변경 핸들러
  const updateProp = (key: string, value: unknown) => {
    const merged = { ...localProps, [key]: value };
    setLocalProps(merged);
    onChange(localType, merged);
  };

  return (
    <div className="space-y-2">
      {/* 블록 타입 선택 */}
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

      {/* Color 속성 */}
      <div>
        <label className="block font-semibold mb-1">{t("COLOR")}:</label>
        <input
          type="color"
          className="w-14 h-7"
          value={(localProps.color as string) ?? "#ffffff"}
          onChange={(e) => updateProp("color", e.target.value)}
        />
      </div>

      {/* Name 속성 */}
      <div>
        <label className="block font-semibold mb-1">{t("NAME")}:</label>
        <Input
          value={(localProps.name as string) ?? ""}
          onChange={(e) => updateProp("name", e.target.value)}
        />
      </div>

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
            <textarea
              className="border w-full h-24 p-2"
              value={(localProps.code as string) ?? ""}
              onChange={(e) => updateProp("code", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* file_path 블록인 경우 파일 선택 UI 표시 */}
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
