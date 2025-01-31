/** clip 타입 블록에서는 별도 properties 가 거의 없다고 가정 */
export interface ClipBlockProps {
  name?: string; // 예: "MyClip"
}

/** project_root 블록에서는 프로젝트 루트 경로가 들어간다고 가정 */
export interface ProjectRootBlockProps {
  rootPath?: string; // 예: "/User/me/my-proj"
}

/** selected_path 블록: 유저가 선택한 경로들이 배열로 들어간다고 가정 */
export interface SelectedPathBlockProps {
  paths?: string[];
}

/** action 블록: copy, txtExtract 등 액션 유형 및 code 등 */
export interface ActionBlockProps {
  actionType?: string; // "copy" | "txtExtract" | ...
  code?: string;
  requiredBlockTypes?: string[];
}
