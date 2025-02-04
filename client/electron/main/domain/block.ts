/**
 * Block 인터페이스: 모든 block은 동일한 데이터 모델을 사용합니다.
 */
export interface Block {
  id: string;
  type: string; // 사용자 정의 block type (예: clip, action, file_path, 커스텀 타입 등)
  properties: Record<string, unknown>;
  content: string[]; // 자식 block id 배열
  parent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AnyBlock = Block;
