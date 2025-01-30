import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * BlockFormData
 *  - (A) type: "clip" | "project_root" | "selected_path" | "action"
 *  - (B) properties: Record<string, any>
 */
export interface BlockFormData {
  type: string;
  properties: Record<string, any>;
}

/**
 * BlockPropertyFormProps
 *  - blockType
 *  - properties
 *  - onChange(newType, newProps)
 */
interface BlockPropertyFormProps {
  blockType: string; // 현재 block type
  properties: Record<string, any>; // 현재 props
  onChange: (newType: string, newProps: Record<string, any>) => void;
}

/**
 * BlockPropertyForm
 *  - type에 따라 서로 다른 폼 필드를 보여주는 컴포넌트
 *  - ex) clip: name
 *        action: actionType, code
 *        project_root: rootPath
 *        selected_path: paths
 */
export default function BlockPropertyForm({
  blockType,
  properties,
  onChange,
}: BlockPropertyFormProps) {
  // 로컬 state로 관리한 뒤, onChange()로 최종 반영
  const [localType, setLocalType] = useState(blockType);
  const [localProps, setLocalProps] = useState({ ...properties });

  useEffect(() => {
    setLocalType(blockType);
    setLocalProps({ ...properties });
  }, [blockType, properties]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setLocalType(newType);
    // type 바뀌어도 기존 props는 그대로 유지
    onChange(newType, localProps);
  };

  /** 특정 key의 property를 업데이트 */
  const updateProp = (key: string, value: any) => {
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

      {/* Color 속성(공통 가정) */}
      <div>
        <label className="block font-semibold mb-1">Color:</label>
        <input
          type="color"
          className="w-14 h-7"
          value={localProps.color ?? "#ffffff"}
          onChange={(e) => updateProp("color", e.target.value)}
        />
      </div>

      {/* type 별로 분기하여 폼 표시 */}
      {localType === "clip" && (
        <div>
          <label className="block font-semibold mb-1">Clip Name:</label>
          <Input
            value={localProps.name ?? ""}
            onChange={(e) => updateProp("name", e.target.value)}
          />
        </div>
      )}

      {localType === "project_root" && (
        <div>
          <label className="block font-semibold mb-1">Root Path:</label>
          <Input
            placeholder="/path/to/project"
            value={localProps.rootPath ?? ""}
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
              Array.isArray(localProps.paths) ? localProps.paths.join(", ") : ""
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
              value={localProps.actionType ?? "copy"}
              onChange={(e) => updateProp("actionType", e.target.value)}
            >
              <option value="copy">copy</option>
              <option value="txtExtract">txtExtract</option>
              {/* 필요 시 추가 */}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Code (optional):</label>
            <textarea
              className="border w-full h-24 p-2"
              value={localProps.code ?? ""}
              onChange={(e) => updateProp("code", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
