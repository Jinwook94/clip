import { Clip } from "../domain/clip";

/**
 * IClipRepository
 *  - Clip 엔터티에 대한 데이터 접근 인터페이스
 */
export interface IClipRepository {
  findAll(): Promise<Clip[]>;
  findById(id: string): Promise<Clip | null>;
  create(clip: Clip): Promise<void>;
  update(clip: Clip): Promise<void>;
  deleteById(id: string): Promise<void>;
}
