/** clip 타입 블록에서는 별도 properties 가 거의 없다고 가정 */
export interface ClipBlockProps {
  name?: string; // 예: "MyClip"
}

/** action 블록: copy, txtExtract 등 액션 유형 및 code 등 */
export interface ActionBlockProps {
  actionType?: string; // "copy" | "txtExtract" | ...
  code?: string;
  requiredBlockTypes?: string[];
}
