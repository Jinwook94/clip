import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import FileSelectionModal from "./FileSelectionModal";
import { toast } from "@/hooks/use-toast";
import { IconX } from "@tabler/icons-react";

export interface BlockFormData {
  type: string;
  properties: Record<string, unknown>;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select";
  options?: string[];
  order: number;
  defaultValue?: any;
}

export interface BlockTypeDefinition {
  id: string;
  name: string;
  propertiesDefinition: FieldDefinition[];
}

interface BlockPropertyFormProps {
  blockType: string;
  properties: Record<string, unknown>;
  onChange: (newType: string, newProps: Record<string, unknown>) => void;
  disableTypeSelection?: boolean;
  // 새로 추가: 현재 DB에 저장된 모든 block type들을 옵션으로 전달
  availableBlockTypes?: BlockTypeDefinition[];
  // 기존 block type definition (선택된 type에 해당하는 정의) – properties 필드 렌더링용
  blockTypeDefinition?: BlockTypeDefinition;
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
  blockTypeDefinition,
  availableBlockTypes,
}: BlockPropertyFormProps) {
  const { t } = useTranslation();
  const [localType, setLocalType] = useState(blockType);
  const [localProps, setLocalProps] = useState({ ...properties });
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [shortcut, setShortcut] = useState<string>(
    (localProps.shortcut as string) || "",
  );

  useEffect(() => {
    setLocalType(blockType);
    setLocalProps({ ...properties });
    if (blockType === "clip" && properties.shortcut) {
      setShortcut(properties.shortcut as string);
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
            {/* availableBlockTypes가 있으면 해당 옵션 목록을 렌더링 */}
            {availableBlockTypes && availableBlockTypes.length > 0 ? (
              availableBlockTypes.map((bt) => (
                <option key={bt.id} value={bt.name}>
                  {bt.name}
                </option>
              ))
            ) : (
              // 없으면 기존 값만 표시
              <option value={localType}>{localType}</option>
            )}
          </select>
        </div>
      )}
      {blockTypeDefinition ? (
        <>
          {blockTypeDefinition.propertiesDefinition
            .sort((a, b) => a.order - b.order)
            .map((field) => {
              const value = localProps[field.key] ?? field.defaultValue ?? "";
              return (
                <div key={field.key}>
                  <label className="block font-semibold mb-1">
                    {field.label}:
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      className="border p-1 w-full"
                      value={value as string}
                      onChange={(e) => updateProp(field.key, e.target.value)}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="border p-1 w-full"
                      value={value as string}
                      onChange={(e) => updateProp(field.key, e.target.value)}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={value as string}
                      onChange={(e) => updateProp(field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
        </>
      ) : (
        <>
          <div>
            <label className="block font-semibold mb-1">{t("NAME")}:</label>
            <Input
              value={(localProps.name as string) ?? ""}
              onChange={(e) => updateProp("name", e.target.value)}
            />
          </div>
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
          {localType === "file_path" && (
            <div className="space-y-2">
              <div>
                <label className="block font-semibold mb-1">Root Path:</label>
                <div className="flex items-center">
                  <Input
                    readOnly
                    placeholder="Select Root"
                    value={
                      typeof localProps.rootPath === "string" &&
                      localProps.rootPath
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
                      toast({
                        description: "Please select a Root Path first.",
                      });
                      return;
                    }
                    setFileModalOpen(true);
                  }}
                >
                  Select Files/Directories
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(localProps.paths) &&
                localProps.paths.length > 0 ? (
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
                          const newPaths = (
                            localProps.paths as string[]
                          ).filter((path) => path !== p);
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
        </>
      )}
    </div>
  );
}
