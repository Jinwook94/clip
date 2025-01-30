// client/electron/main/db.ts
import path from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";
// import { migrate } from "better-sqlite3-migrations"; // 마이그레이션 사용 시

/**
 * dbPath: userData 폴더 아래에 clip.sqlite3 (필요 시 SQLCipher나 다른 암호화 적용 가능)
 */
const dbPath = path.join(app.getPath("userData"), "clip.sqlite3");

/**
 * export let db: Database.Database
 *  - Repository에서 사용할 DB 인스턴스
 */
export let db: Database.Database;

/**
 * initDB()
 *  - DB 인스턴스를 생성
 *  - SQLCipher(옵션), WAL 모드, synchronous 설정
 *  - 필요 시 better-sqlite3-migrations로 마이그레이션
 *  - initSchema()로 기본 테이블 보장
 */
export function initDB() {
  db = new Database(dbPath, {
    verbose: console.log,
  });

  // (옵션) SQLCipher 키 설정 (better-sqlite3-with-crypto 사용 시)
  // db.pragma(`KEY='some_strong_password'`);

  // WAL 모드 활성화
  db.pragma("journal_mode = WAL");

  // 동기화 설정 (NORMAL or FULL; 성능 vs 안정성)
  db.pragma("synchronous = NORMAL");

  // (옵션) better-sqlite3-migrations
  // try {
  //   migrate(db, {
  //     force: false,
  //     migrationsPath: path.join(__dirname, "../migrations"),
  //   });
  // } catch (err) {
  //   console.error("[DB] Migration failed:", err);
  // }

  initSchema();
  console.log("[DB] Initialized at:", dbPath);
}

/**
 * initSchema()
 *  - clips, labels, clip_labels 등 테이블이 없으면 생성
 *  - 기존 컬럼과 충돌 없이 안전하게 생성만 수행
 */
function initSchema() {
  db.exec(`
        CREATE TABLE IF NOT EXISTS clips (
                                             id TEXT PRIMARY KEY,
                                             name TEXT,
                                             project_root TEXT,
                                             selected_paths TEXT,
                                             action_type TEXT,
                                             action_code TEXT,
                                             is_favorite INTEGER DEFAULT 0,
                                             created_at TEXT,
                                             updated_at TEXT
        );
    `);

  db.exec(`
        CREATE TABLE IF NOT EXISTS labels (
                                              id TEXT PRIMARY KEY,
                                              name TEXT,
                                              color TEXT,
                                              created_at TEXT,
                                              updated_at TEXT
        );
    `);

  db.exec(`
        CREATE TABLE IF NOT EXISTS clip_labels (
                                                   clip_id TEXT,
                                                   label_id TEXT,
                                                   created_at TEXT,
                                                   PRIMARY KEY (clip_id, label_id)
            );
    `);
}
