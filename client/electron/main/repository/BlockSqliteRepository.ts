import { Database } from "better-sqlite3";
import { nanoid } from "nanoid";
import type { AnyBlock } from "../domain/block";

/**
 * DB에 저장된 blocks 테이블 한 행을 나타내는 인터페이스
 *  - properties, content 컬럼은 JSON 문자열 형태로 저장되어 있으므로
 *    실제 사용할 때는 parse가 필요합니다.
 */
interface BlockDbRow {
  id: string; // PRIMARY KEY (TEXT)
  type: string; // "clip" | "action" | ...
  properties: string; // JSON string
  content: string; // JSON string of string[]
  parent: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * BlockSqliteRepository
 *  - Notion 유사 blocks 테이블을 다루는 저장소 예시
 */
export class BlockSqliteRepository {
  constructor(private db: Database) {}

  /**
   * 모든 블록을 조회하여 AnyBlock[] 형태로 반환
   */
  async findAll(): Promise<AnyBlock[]> {
    const rows = this.db
      .prepare("SELECT * FROM blocks ORDER BY created_at ASC")
      .all();

    // rowToBlock에서 type에 따라 properties를 parse
    return rows.map((r) => this.rowToBlock(r));
  }

  /**
   * 특정 ID의 블록을 찾아 반환
   */
  async findById(id: string): Promise<AnyBlock | null> {
    const row = this.db.prepare("SELECT * FROM blocks WHERE id=?").get(id);
    if (!row) return null;
    return this.rowToBlock(row);
  }

  /**
   * 블록 생성
   *  - partial AnyBlock을 받아, DB에 새 레코드로 삽입
   *  - 반환값은 새로 생성된 블록의 ID
   */
  async create(block: Partial<AnyBlock>): Promise<string> {
    const now = new Date().toISOString();

    // ID가 없으면 nanoid() 생성
    const newId = block.id ?? nanoid();
    const newType = block.type ?? "clip";

    // DB에 JSON으로 저장할 때는 string으로 직렬화
    const propsJson = JSON.stringify(block.properties ?? {});
    const contentJson = JSON.stringify(block.content ?? []);

    this.db
      .prepare(
        `
      INSERT INTO blocks (id, type, properties, content, parent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        newId,
        newType,
        propsJson,
        contentJson,
        block.parent ?? null,
        now,
        now,
      );

    return newId;
  }

  /**
   * 블록 업데이트
   *  - 이미 존재하는 블록을 덮어씀
   */
  async update(block: AnyBlock): Promise<void> {
    const now = new Date().toISOString();

    const propsJson = JSON.stringify(block.properties);
    const contentJson = JSON.stringify(block.content);

    this.db
      .prepare(
        `
      UPDATE blocks
      SET
        type = ?,
        properties = ?,
        content = ?,
        parent = ?,
        updated_at = ?
      WHERE id = ?
    `,
      )
      .run(
        block.type,
        propsJson,
        contentJson,
        block.parent ?? null,
        now,
        block.id,
      );
  }

  /**
   * 블록 삭제
   *  - 자식 블록을 어떻게 처리할지는 설계에 따라 달라질 수 있음
   *  - 여기서는 해당 블록만 삭제
   */
  async deleteById(id: string): Promise<void> {
    this.db
      .prepare(
        `
      DELETE FROM blocks
      WHERE id = ?
    `,
      )
      .run(id);
  }

  /**
   * DB에서 읽은 한 줄(row)을 AnyBlock 형태로 변환
   *  - type별로 properties를 적절히 분기하여 반환
   */
  private rowToBlock(raw: unknown): AnyBlock {
    // 먼저 BlockDbRow 형태로 캐스팅
    const row = raw as BlockDbRow;

    // 공통 필드
    const commonFields = {
      id: String(row.id),
      content: JSON.parse(row.content || "[]") as string[],
      parent: row.parent || null,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
    };

    // properties JSON parse
    const parsedProps = JSON.parse(row.properties || "{}");

    // type별로 분기 (디스크리미네이티드 유니온)
    switch (row.type) {
      case "clip":
        return {
          type: "clip",
          properties: parsedProps,
          ...commonFields,
        };
      case "action":
        return {
          type: "action",
          properties: parsedProps,
          ...commonFields,
        };
      case "project_root":
        return {
          type: "project_root",
          properties: parsedProps,
          ...commonFields,
        };
      case "selected_path":
        return {
          type: "selected_path",
          properties: parsedProps,
          ...commonFields,
        };
      default:
        // 혹은 throw new Error(`Unknown block type: ${row.type}`)
        // 여기서는 임시로 "clip" 취급
        return {
          type: "clip",
          properties: parsedProps,
          ...commonFields,
        };
    }
  }
}
