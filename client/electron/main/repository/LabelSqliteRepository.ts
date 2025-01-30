import { Database } from "better-sqlite3";
import { ILabelRepository } from "./ILabelRepository";
import { Label } from "../domain/label";

export class LabelSqliteRepository implements ILabelRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Label[]> {
    const rows = this.db.prepare("SELECT * FROM labels").all() as {
      id: string;
      name: string;
      color: string;
      created_at?: string;
      updated_at?: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string): Promise<Label | null> {
    const row = this.db.prepare("SELECT * FROM labels WHERE id=?").get(id) as
      | {
          id: string;
          name: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(label: Label): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO labels (id, name, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(label.id, label.name, label.color, now, now);
  }

  async update(label: Label): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE labels
         SET name=?, color=?, updated_at=?
         WHERE id=?`,
      )
      .run(label.name, label.color, now, label.id);
  }

  async deleteById(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM clip_labels WHERE label_id=?`).run(id);
    this.db.prepare(`DELETE FROM labels WHERE id=?`).run(id);
  }

  async addLabelToClip(clipId: string, labelId: string): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT OR IGNORE INTO clip_labels (clip_id, label_id, created_at)
         VALUES (?, ?, ?)
        `,
      )
      .run(clipId, labelId, now);
  }

  async removeLabelFromClip(clipId: string, labelId: string): Promise<void> {
    this.db
      .prepare(`DELETE FROM clip_labels WHERE clip_id=? AND label_id=?`)
      .run(clipId, labelId);
  }

  async countLabelsOfClip(clipId: string): Promise<number> {
    const row = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM clip_labels WHERE clip_id=?`)
      .get(clipId) as { cnt: number };
    return row.cnt;
  }

  async findLabelsByClip(clipId: string): Promise<Label[]> {
    const rows = this.db
      .prepare(
        `SELECT l.*
         FROM labels l
         INNER JOIN clip_labels cl ON l.id = cl.label_id
         WHERE cl.clip_id=?
        `,
      )
      .all(clipId) as {
      id: string;
      name: string;
      color: string;
      created_at?: string;
      updated_at?: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }
}
