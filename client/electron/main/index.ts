import { app, BrowserWindow, shell, globalShortcut } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import store from "./store";
import { createTray } from "./tray";
import { update } from "./update";
import { initAllIpc } from "./ipc";
import { initAppRepositories } from "./di";

let win: BrowserWindow | null = null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.env.APP_ROOT = path.join(__dirname, "../..");
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// OS 설정
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// 이미 실행 중이면 종료
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

async function createWindow() {
  // (1) DB + Repositories 초기화
  const repos = initAppRepositories(); // DB, clipRepository, labelRepository

  // (2) 모든 IPC 등록
  initAllIpc();

  // (선택) Repositories 사용 예시
  const allClips = await repos.clipRepository.findAll();
  console.log("[DB] loaded clips =>", allClips);

  // 브라우저 창 생성
  const { width = 900, height = 680 } = store.get("windowBounds") || {};
  const isMac = process.platform === "darwin";

  win = new BrowserWindow({
    title: "Clip",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width,
    height,
    frame: isMac ? true : false,
    titleBarStyle: isMac ? "hiddenInset" : undefined,
    trafficLightPosition: isMac ? { x: 20, y: 16 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
    },
  });

  win.on("resize", () => {
    if (!win) return;
    const { width, height } = win.getBounds();
    store.set("windowBounds", { width, height });
  });

  if (VITE_DEV_SERVER_URL) {
    await win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  createTray(win);
  update(win);
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("CommandOrControl+Shift+X", () => {
    console.log("Global Shortcut Triggered!");
    if (win) {
      win.webContents.send("shortcut-triggered", "Hello from main!");
    }
  });
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
