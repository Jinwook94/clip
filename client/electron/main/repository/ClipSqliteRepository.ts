import { IClipRepository } from "./IClipRepository";
import { Clip } from "../domain/clip";
import { Database } from "better-sqlite3";

export class ClipSqliteRepository implements IClipRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Clip[]> {
    const rows = this.db.prepare("SELECT * FROM clips").all() as {
      id: string;
      name: string;
      project_root: string;
      selected_paths?: string;
      action_type: string;
      action_code?: string;
      is_favorite?: number;
      created_at?: string;
      updated_at?: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      projectRoot: r.project_root,
      selectedPaths: r.selected_paths ? JSON.parse(r.selected_paths) : [],
      actionType: r.action_type as Clip["actionType"],
      actionCode: r.action_code || "",
      isFavorite: !!r.is_favorite,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string): Promise<Clip | null> {
    const row = this.db.prepare("SELECT * FROM clips WHERE id=?").get(id) as
      | {
          id: string;
          name: string;
          project_root: string;
          selected_paths?: string;
          action_type: string;
          action_code?: string;
          is_favorite?: number;
          created_at?: string;
          updated_at?: string;
        }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      projectRoot: row.project_root,
      selectedPaths: row.selected_paths ? JSON.parse(row.selected_paths) : [],
      actionType: row.action_type as Clip["actionType"],
      actionCode: row.action_code || "",
      isFavorite: !!row.is_favorite,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(clip: Clip): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
                    INSERT INTO clips (
                        id, name, project_root, selected_paths, action_type, action_code,
                        is_favorite, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
      )
      .run(
        clip.id,
        clip.name,
        clip.projectRoot,
        JSON.stringify(clip.selectedPaths || []),
        clip.actionType,
        clip.actionCode || "",
        clip.isFavorite ? 1 : 0,
        now,
        now,
      );
  }

  async update(clip: Clip): Promise<void> {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
                    UPDATE clips
                    SET
                        name=?,
                        project_root=?,
                        selected_paths=?,
                        action_type=?,
                        action_code=?,
                        is_favorite=?,
                        updated_at=?
                    WHERE id=?
                `,
      )
      .run(
        clip.name,
        clip.projectRoot,
        JSON.stringify(clip.selectedPaths || []),
        clip.actionType,
        clip.actionCode || "",
        clip.isFavorite ? 1 : 0,
        now,
        clip.id,
      );
  }

  async deleteById(id: string): Promise<void> {
    this.db.prepare(`DELETE FROM clip_labels WHERE clip_id=?`).run(id);
    this.db.prepare(`DELETE FROM clips WHERE id=?`).run(id);
  }
}
