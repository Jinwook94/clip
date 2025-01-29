import Database from "better-sqlite3";
import path from "node:path";
import { app } from "electron";
import { ClipItem } from "../../src/store/clipStore"; // (렌더러 코드이지만, 타입만 재사용)

const dbPath = path.join(app.getPath("userData"), "clip.sqlite3");
let db: Database.Database;

interface DBClipRow {
  id: string;
  name: string;
  project_root: string;
  selected_paths?: string;
  action_type: string;
  action_code?: string;
  created_at?: string; // 필요 시
}

export function initDB() {
  db = new Database(dbPath, {
    verbose: console.log, // 모든 쿼리 콘솔 출력
  });

  db.exec(`
    CREATE TABLE IF NOT EXISTS clips (
                                       id TEXT PRIMARY KEY,
                                       name TEXT,
                                       project_root TEXT,
                                       selected_paths TEXT,
                                       action_type TEXT,
                                       action_code TEXT,
                                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("[DB] Initialized at:", dbPath);
}

// 앱 시작 시 DB에서 모든 Clip 로드
export function loadAllClipsFromDB(): ClipItem[] {
  const rows = db.prepare("SELECT * FROM clips").all() as DBClipRow[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    projectRoot: r.project_root,
    selectedPaths: JSON.parse(r.selected_paths || "[]"),

    // 여기서 단언
    actionType: r.action_type as ClipItem["actionType"],

    actionCode: r.action_code || undefined,
    shortcut: undefined,
  }));
}

// 새 Clip 추가 (id는 renderer에서 미리 생성한 nanoid)
export function insertClipToDB(clip: ClipItem) {
  db.prepare(
    `
    INSERT INTO clips (id, name, project_root, selected_paths, action_type, action_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    clip.id,
    clip.name,
    clip.projectRoot,
    JSON.stringify(clip.selectedPaths),
    clip.actionType,
    clip.actionCode || "",
  );
}

// Clip 수정
export function updateClipInDB(clip: ClipItem) {
  db.prepare(
    `
    UPDATE clips
    SET
      name=?,
      project_root=?,
      selected_paths=?,
      action_type=?,
      action_code=?
    WHERE id=?
  `,
  ).run(
    clip.name,
    clip.projectRoot,
    JSON.stringify(clip.selectedPaths),
    clip.actionType,
    clip.actionCode || "",
    clip.id,
  );
}

// Clip 삭제
export function deleteClipFromDB(clipId: string) {
  db.prepare(`DELETE FROM clips WHERE id=?`).run(clipId);
}
