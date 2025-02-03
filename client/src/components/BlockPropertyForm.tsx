import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

/**
 * 블록 생성/편집 폼에서 사용하는 데이터 구조
 */
export interface BlockFormData {
  type: string;
  properties: Record<string, unknown>;
}

/**
 * 컴포넌트 Prop 정의
 */
interface BlockPropertyFormProps {
  blockType: string; // 현재 block type
  properties: Record<string, unknown>;
  onChange: (newType: string, newProps: Record<string, unknown>) => void;
}

export default function BlockPropertyForm({
  blockType,
  properties,
  onChange,
}: BlockPropertyFormProps) {
  const { t } = useTranslation();

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
        <label className="block font-semibold mb-1">{t("BLOCK_TYPE")}:</label>
        <select
          className="border p-1 w-full"
          value={localType}
          onChange={handleTypeChange}
        >
          <option value="clip">clip</option>
          <option value="action">action</option>
        </select>
      </div>

      {/* Color 속성(예시) */}
      <div>
        <label className="block font-semibold mb-1">{t("COLOR")}:</label>
        <input
          type="color"
          className="w-14 h-7"
          value={(localProps.color as string) ?? "#ffffff"}
          onChange={(e) => updateProp("color", e.target.value)}
        />
      </div>

      {/* 항상 Name 표시 */}
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
            ></select>
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
    </div>
  );
}
