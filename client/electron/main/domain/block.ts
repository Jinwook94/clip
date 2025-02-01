import { ActionBlockProps, ClipBlockProps } from "./blockProps";

/** 블록의 공통 필드. properties 의 타입은 제네릭으로 지정 */
export interface BaseBlock<T = Record<string, unknown>> {
  id: string;
  content: string[];
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** reserved block type: clip, action. 나머지는 사용자 정의 가능 */
  type: string;
  /** 각 블록의 properties */
  properties: T;
}

/** reserved block: clip */
export interface ClipBlock extends BaseBlock<ClipBlockProps> {
  type: "clip";
}

/** reserved block: action */
export interface ActionBlock extends BaseBlock<ActionBlockProps> {
  type: "action";
}

/** 사용자 정의 블록 */
export interface UserDefinedBlock extends BaseBlock {
  type: Exclude<string, "clip" | "action">;
}

/** 모든 블록 타입 */
export type AnyBlock = ClipBlock | ActionBlock | UserDefinedBlock;
