// client/electron/main/db.ts
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
   *  - type: 사용자 정의 block type 문자열 (예: clip, action, file_path, 커스텀타입 등)
   *  - properties: 해당 block의 모든 속성을 JSON 문자열로 저장
   *  - content: 자식 block들의 id 배열을 JSON 문자열로 저장
   *  - parent: 상위 block id (nullable)
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

  // block_types 테이블: 각 block type에 대한 정의(필드 구성, 순서 등)를 저장
  db.exec(`
        CREATE TABLE IF NOT EXISTS block_types (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          properties_definition TEXT NOT NULL,
          created_at TEXT,
          updated_at TEXT
        );
    `);
}
