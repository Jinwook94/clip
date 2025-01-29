import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  dialog,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

import {
  deleteClipFromDB,
  initDB,
  insertClipToDB,
  loadAllClipsFromDB,
  updateClipInDB,
} from "./db.js";
import store from "./store.js";
import { createTray } from "./tray.js";
import { update } from "./update.js";
import { readDirectoryStructure } from "./fileSystem.js";
import { initGlobalShortcuts } from "./globalShortcuts.js";
import { runClipAction } from "./clipActions";
import { ClipItem } from "@/store/clipStore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // 필요시 app.quit() 등 처리
});

process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// OS별 설정
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// 이미 앱이 실행 중이라면 종료
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  // DB 초기화
  initDB();

  // Clip DB 확인
  const existing = loadAllClipsFromDB();
  console.log("[DB] loaded clips =>", existing);

  const { width = 900, height = 680 } = store.get("windowBounds") || {};

  win = new BrowserWindow({
    title: "Clip",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width,
    height,
    webPreferences: {
      preload,
    },
  });

  // 창 리사이즈 시, 설정 저장
  win.on("resize", () => {
    if (!win) return;
    const { width, height } = win.getBounds();
    store.set("windowBounds", { width, height });
  });

  // 로딩
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // 예시: 로드 완료 시, 메인 프로세스 메시지 전달
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // 새 창 열기 시도 -> 외부 브라우저
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Tray
  createTray(win);

  // Auto updater
  update(win);
}

// 디렉토리 선택 IPC
ipcMain.handle("show-directory-dialog", async (_event) => {
  const result = await dialog.showOpenDialog({
    title: "Select Project Root",
    properties: ["openDirectory"],
  });
  // 사용자가 폴더 선택하지 않고 취소하면, 빈 배열
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle("clips-load", () => {
  // DB에서 모든 clip 조회
  return loadAllClipsFromDB();
});
ipcMain.handle("clips-insert", (_e, clip: ClipItem) => {
  insertClipToDB(clip);
  return { success: true };
});
ipcMain.handle("clips-update", (_e, clip: ClipItem) => {
  updateClipInDB(clip);
  return { success: true };
});
ipcMain.handle("clips-delete", (_e, clipId: string) => {
  deleteClipFromDB(clipId);
  return { success: true };
});

// Clip 액션 실행 후, 클립보드 복사 같은 상황을 클라이언트에 알림
// 이미 "clip-run" IPC가 있고, runClipAction을 호출한 뒤, "clip-run-done"을 전송
// clipActions.ts 안에서 해도 되지만, 간단히 여기서 처리
ipcMain.on("clip-run", (event, clipData) => {
  console.log("[clip-run] =>", clipData);

  runClipAction(
    clipData.actionType,
    clipData.selectedPaths,
    clipData.actionCode,
  );

  let msg = "";
  if (clipData.actionType === "copy") {
    msg = "Copied to clipboard!";
  } else if (clipData.actionType === "txtExtract") {
    msg = "Txt extract done (copied)!";
  }

  event.sender.send("clip-run-done", { message: msg });
});

app.whenReady().then(() => {
  createWindow();

  // 전역 단축키 예시 (기존)
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    console.log("Global Shortcut Triggered!");
    if (win) {
      win.webContents.send("shortcut-triggered", "Hello from main!");
    }
  });

  // 우리가 만든 clips 전역 단축키 시스템 초기화
  initGlobalShortcuts();
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// IPC: 폴더 구조 읽기
ipcMain.handle("read-dir-structure", (_event, rootDir: string) => {
  return readDirectoryStructure(rootDir);
});
