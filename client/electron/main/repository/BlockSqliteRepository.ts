import { Database } from "better-sqlite3";
import { nanoid } from "nanoid";
import type { AnyBlock } from "../domain/block";

interface BlockDbRow {
  id: string;
  type: string;
  properties: string;
  content: string;
  parent: string | null;
  created_at?: string;
  updated_at?: string;
}

export class BlockSqliteRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<AnyBlock[]> {
    const rows = this.db
      .prepare("SELECT * FROM blocks ORDER BY created_at ASC")
      .all() as unknown[];
    return rows.map((row) => this.rowToBlock(row as BlockDbRow));
  }

  async findById(id: string): Promise<AnyBlock | null> {
    const row = this.db
      .prepare("SELECT * FROM blocks WHERE id=?")
      .get(id) as unknown;
    if (!row) return null;
    return this.rowToBlock(row as BlockDbRow);
  }

  async create(block: Partial<AnyBlock>): Promise<string> {
    const now = new Date().toISOString();
    const newId = block.id ?? nanoid();
    const newType = block.type ?? "clip";
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

  async update(block: AnyBlock): Promise<void> {
    const now = new Date().toISOString();
    const propsJson = JSON.stringify(block.properties);
    const contentJson = JSON.stringify(block.content);
    this.db
      .prepare(
        `
          UPDATE blocks
          SET type = ?,
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

  private rowToBlock(row: BlockDbRow): AnyBlock {
    return {
      id: row.id,
      type: row.type,
      properties: JSON.parse(row.properties || "{}"),
      content: JSON.parse(row.content || "[]"),
      parent: row.parent || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
