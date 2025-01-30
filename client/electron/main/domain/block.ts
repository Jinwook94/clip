import {
  ActionBlockProps,
  ClipBlockProps,
  ProjectRootBlockProps,
  SelectedPathBlockProps,
} from "./blockProps";

/** 블록 공통 필드 */
interface BaseBlock {
  id: string;
  content: string[];
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** type: "clip" */
export interface ClipBlock extends BaseBlock {
  type: "clip";
  properties: ClipBlockProps;
}

/** type: "project_root" */
export interface ProjectRootBlock extends BaseBlock {
  type: "project_root";
  properties: ProjectRootBlockProps;
}

/** type: "selected_path" */
export interface SelectedPathBlock extends BaseBlock {
  type: "selected_path";
  properties: SelectedPathBlockProps;
}

/** type: "action" */
export interface ActionBlock extends BaseBlock {
  type: "action";
  properties: ActionBlockProps;
}

/**
 * 전체 블록 유니온
 *  - 블록 DB에 저장할 때, 결국 AnyBlock (4가지 중 하나)이 될 수 있음
 */
export type AnyBlock =
  | ClipBlock
  | ProjectRootBlock
  | SelectedPathBlock
  | ActionBlock;
