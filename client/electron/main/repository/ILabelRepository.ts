import { Label } from "../domain/label";

/**
 * ILabelRepository
 *  - Label 엔터티에 대한 데이터 접근 인터페이스
 */
export interface ILabelRepository {
  findAll(): Promise<Label[]>;
  findById(id: string): Promise<Label | null>;
  create(label: Label): Promise<void>;
  update(label: Label): Promise<void>;
  deleteById(id: string): Promise<void>;

  // Clip <-> Label 연결
  addLabelToClip(clipId: string, labelId: string): Promise<void>;
  removeLabelFromClip(clipId: string, labelId: string): Promise<void>;
  countLabelsOfClip(clipId: string): Promise<number>;
  findLabelsByClip(clipId: string): Promise<Label[]>;
}
