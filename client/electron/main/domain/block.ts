import { ActionBlockProps, ClipBlockProps, FileBlockProps } from "./blockProps";

/** 블록의 공통 필드. */
export interface BaseBlock<T = Record<string, unknown>> {
  id: string;
  content: string[];
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** reserved block type: clip, action, file_path. 나머지는 사용자 정의 가능 */
  type: string;
  properties: T;
}

/** clip 블록 */
export interface ClipBlock extends BaseBlock<ClipBlockProps> {
  type: "clip";
}

/** action 블록 */
export interface ActionBlock extends BaseBlock<ActionBlockProps> {
  type: "action";
}

/** file_path 블록: 하나 이상의 파일 경로를 저장 */
export interface FileBlock extends BaseBlock<FileBlockProps> {
  type: "file_path";
}

/** 사용자 정의 블록: 예약된 "clip", "action", "file_path"는 제외 */
export interface UserDefinedBlock extends BaseBlock {
  type: Exclude<string, "clip" | "action" | "file_path">;
}

/** 모든 블록 타입 */
export type AnyBlock = ClipBlock | ActionBlock | FileBlock | UserDefinedBlock;
