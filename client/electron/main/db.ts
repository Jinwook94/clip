import path from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";

export let db: Database.Database;

export function initDB() {
  const dbPath = path.join(app.getPath("userData"), "clip_blocks.sqlite3");
  db = new Database(dbPath, {
    verbose: console.log,
  });

  // WAL 모드 활성화
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  initSchema();
  console.log("[DB] Initialized blocks at:", dbPath);
}

function initSchema() {
  /**
   * blocks 테이블:
   *  - type: clip | project_root | selected_path | action 등
   *  - properties: 해당 블록의 모든 속성을 JSON으로 저장. (type 변경 시에도 유지)
   *  - content: 자식 블록들의 id 배열을 JSON 문자열로 저장
   *  - parent: 상위 블록 id (nullable)
   */
  db.exec(`
      CREATE TABLE IF NOT EXISTS blocks (
                                            id TEXT PRIMARY KEY,
                                            type TEXT NOT NULL,
                                            properties TEXT NOT NULL,
                                            content TEXT NOT NULL,
                                            parent TEXT,
                                            created_at TEXT,
                                            updated_at TEXT
      );
  `);
}
