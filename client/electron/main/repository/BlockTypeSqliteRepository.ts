import { Database } from "better-sqlite3";
import { nanoid } from "nanoid";
import type { BlockTypeDefinition } from "../domain/blockType";

interface BlockTypeDbRow {
  id: string;
  name: string;
  properties_definition: string;
  created_at?: string;
  updated_at?: string;
}

export class BlockTypeSqliteRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<BlockTypeDefinition[]> {
    const rows = this.db
      .prepare("SELECT * FROM block_types ORDER BY created_at ASC")
      .all() as unknown[];
    return rows.map((row) => this.rowToBlockType(row as BlockTypeDbRow));
  }

  async findById(id: string): Promise<BlockTypeDefinition | null> {
    const row = this.db
      .prepare("SELECT * FROM block_types WHERE id = ?")
      .get(id) as unknown;
    if (!row) return null;
    return this.rowToBlockType(row as BlockTypeDbRow);
  }

  async create(blockType: Partial<BlockTypeDefinition>): Promise<string> {
    const now = new Date().toISOString();
    // id가 없거나 빈 문자열이면 새 id 생성
    const newId =
      blockType.id && blockType.id.trim() !== "" ? blockType.id : nanoid();
    const name = blockType.name ?? "custom";
    const propertiesDefinition = JSON.stringify(
      blockType.propertiesDefinition ?? [],
    );
    this.db
      .prepare(
        `
            INSERT INTO block_types (id, name, properties_definition, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(newId, name, propertiesDefinition, now, now);
    return newId;
  }

  async update(blockType: BlockTypeDefinition): Promise<void> {
    const now = new Date().toISOString();
    const propertiesDefinition = JSON.stringify(blockType.propertiesDefinition);
    this.db
      .prepare(
        `
            UPDATE block_types
            SET name = ?,
                properties_definition = ?,
                updated_at = ?
            WHERE id = ?
        `,
      )
      .run(blockType.name, propertiesDefinition, now, blockType.id);
  }

  async deleteById(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM block_types WHERE id = ?`).run(id);
  }

  private rowToBlockType(row: BlockTypeDbRow): BlockTypeDefinition {
    return {
      id: row.id,
      name: row.name,
      propertiesDefinition: JSON.parse(row.properties_definition),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
