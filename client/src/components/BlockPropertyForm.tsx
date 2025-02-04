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
  // 추가: block 타입 선택 영역을 숨길지 여부 (clip 타입의 경우 수정 불가)
  disableTypeSelection?: boolean;
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
  disableTypeSelection = false,
}: BlockPropertyFormProps) {
  const { t } = useTranslation();
  const [localType, setLocalType] = useState(blockType);
  const [localProps, setLocalProps] = useState({ ...properties });
  const [fileModalOpen, setFileModalOpen] = useState(false);
  // clip 블록에서 사용할 Shortcut 상태 (문자열)
  const [shortcut, setShortcut] = useState<string>(
    (localProps.shortcut as string) || "",
  );

  useEffect(() => {
    setLocalType(blockType);
    setLocalProps({ ...properties });
    // clip 블록일 경우 properties에 shortcut 값이 있다면 로드
    if (blockType === "clip" && properties.shortcut) {
      setShortcut(properties.shortcut as string);
    }
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

  // Shortcut 입력 시 키 조합을 기록하는 핸들러
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

  // action 타입 블록의 경우, 현재 Clip 데스크탑에 존재하는 모든 block type(clip, action 제외)를 옵션으로 사용
  const allBlocks = useBlockStore((state) => state.blocks);
  const availableBlockTypes = Array.from(
    new Set(allBlocks.map((b) => b.type)),
  ).filter((type) => type !== "clip" && type !== "action");

  return (
    <div className="space-y-2">
      {/* 블록 타입 선택: disableTypeSelection가 true이면 숨김 */}
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

      {/*
         수정: 사용자에게 color를 커스터마이징할 수 있는 기능이 더 이상 필요 없으므로,
         Color 속성 관련 입력 필드를 삭제하였습니다.
      */}

      {/* Name 속성 */}
      <div>
        <label className="block font-semibold mb-1">{t("NAME")}:</label>
        <Input
          value={(localProps.name as string) ?? ""}
          onChange={(e) => updateProp("name", e.target.value)}
        />
      </div>

      {/* clip 블록인 경우 Shortcut 입력란 표시 */}
      {localType === "clip" && (
        <div className="space-y-2">
          <div>
            <label className="block font-semibold mb-1">Shortcut:</label>
            <input
              type="text"
              placeholder="Press shortcut keys"
              value={shortcut}
              onKeyDown={handleShortcutKeyDown}
              // onChange 핸들러를 빈 함수로 설정하여 경고 해소
              onChange={() => {}}
              className="border p-1 w-full"
            />
          </div>
        </div>
      )}

      {/* action 블록인 경우 REQUIRED_BLOCKS 및 Code 입력란 표시 */}
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
