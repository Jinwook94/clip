import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

/**
 * 블록 생성/편집 폼에서 사용하는 데이터 구조
 */
export interface BlockFormData {
  type: string;
  properties: Record<string, unknown>; // any 대신 unknown
}

/**
 * 컴포넌트 Prop 정의
 */
interface BlockPropertyFormProps {
  blockType: string; // 현재 block type
  properties: Record<string, unknown>; // any 대신 unknown
  onChange: (newType: string, newProps: Record<string, unknown>) => void; // any 대신 unknown
}

export default function BlockPropertyForm({
  blockType,
  properties,
  onChange,
}: BlockPropertyFormProps) {
  const [localType, setLocalType] = useState(blockType);
  const [localProps, setLocalProps] = useState({ ...properties });

  useEffect(() => {
    setLocalType(blockType);
    setLocalProps({ ...properties });
  }, [blockType, properties]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setLocalType(newType);
    onChange(newType, localProps);
  };

  /** 특정 key의 property를 업데이트 */
  const updateProp = (key: string, value: unknown) => {
    const merged = { ...localProps, [key]: value };
    setLocalProps(merged);
    onChange(localType, merged);
  };

  return (
    <div className="space-y-2">
      {/* 공통: type 선택 */}
      <div>
        <label className="block font-semibold mb-1">Block Type:</label>
        <select
          className="border p-1 w-full"
          value={localType}
          onChange={handleTypeChange}
        >
          <option value="clip">clip</option>
          <option value="project_root">project_root</option>
          <option value="selected_path">selected_path</option>
          <option value="action">action</option>
        </select>
      </div>

      {/* Color 속성(예시) */}
      <div>
        <label className="block font-semibold mb-1">Color:</label>
        <input
          type="color"
          className="w-14 h-7"
          value={(localProps.color as string) ?? "#ffffff"}
          onChange={(e) => updateProp("color", e.target.value)}
        />
      </div>

      {/* 항상 Name 표시 */}
      <div>
        <label className="block font-semibold mb-1">Name:</label>
        <Input
          value={(localProps.name as string) ?? ""}
          onChange={(e) => updateProp("name", e.target.value)}
        />
      </div>

      {/* type 별 추가 폼 */}
      {localType === "project_root" && (
        <div>
          <label className="block font-semibold mb-1">Root Path:</label>
          <Input
            placeholder="/path/to/project"
            value={(localProps.rootPath as string) ?? ""}
            onChange={(e) => updateProp("rootPath", e.target.value)}
          />
        </div>
      )}

      {localType === "selected_path" && (
        <div>
          <label className="block font-semibold mb-1">
            Selected Paths (comma-separated):
          </label>
          <Input
            placeholder="/src, /public, ..."
            value={
              Array.isArray(localProps.paths)
                ? (localProps.paths as string[]).join(", ")
                : ""
            }
            onChange={(e) => {
              const arr = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s);
              updateProp("paths", arr);
            }}
          />
        </div>
      )}

      {localType === "action" && (
        <div className="space-y-2">
          <div>
            <label className="block font-semibold mb-1">Action Type:</label>
            <select
              className="border p-1 w-full"
              value={(localProps.actionType as string) ?? "copy"}
              onChange={(e) => updateProp("actionType", e.target.value)}
            >
              <option value="copy">copy</option>
              <option value="txtExtract">txtExtract</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Code (optional):</label>
            <textarea
              className="border w-full h-24 p-2"
              value={(localProps.code as string) ?? ""}
              onChange={(e) => updateProp("code", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
