import {
  ActionBlockProps,
  ClipBlockProps,
  FileBlockProps,
  SnippetBlockProps,
} from "./blockProps";

/** 블록의 공통 필드. */
export interface BaseBlock<T = Record<string, unknown>> {
  id: string;
  content: string[];
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

/** snippet 블록: 텍스트 뭉치를 저장 */
export interface SnippetBlock extends BaseBlock<SnippetBlockProps> {
  type: "snippet";
}

/** 모든 블록 타입 */
export type AnyBlock = ClipBlock | ActionBlock | FileBlock | SnippetBlock;
