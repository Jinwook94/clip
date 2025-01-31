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
let isQuitting = false;

app.name = "Clip";

// 개발모드 여부
const isDev = !!process.env.VITE_DEV_SERVER_URL;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 예외 처리
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.env.APP_ROOT = path.join(__dirname, "../..");
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_PUBLIC = isDev
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();
if (process.platform === "win32") {
  app.setAppUserModelId(app.getName());
}

// 여러 인스턴스 방지
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

async function createWindow() {
  // DB 초기화 + IPC 등록
  const repos = initAppRepositories();
  initAllIpc();

  const allBlocks = await repos.blockRepository.findAll();
  console.log("[DB] loaded blocks =>", allBlocks);

  const { width = 900, height = 680 } = store.get("windowBounds") || {};
  const isMac = process.platform === "darwin";

  // Windows는 skipTaskbar: true (작업표시줄 숨김), 맥은 Dock 표시를 동적으로
  win = new BrowserWindow({
    title: "Clip",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width,
    height,
    skipTaskbar: process.platform !== "darwin", // Mac이면 false
    frame: isMac ? true : false,
    titleBarStyle: isMac ? "hiddenInset" : undefined,
    trafficLightPosition: isMac ? { x: 20, y: 16 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
    },
  });

  // 창 크기 변경 시 저장
  win.on("resize", () => {
    if (!win) return;
    const { width, height } = win.getBounds();
    store.set("windowBounds", { width, height });
  });

  /**
   * Mac 전용: show/hide 이벤트에 따라 Dock show/hide
   *  - show()되면 Dock도 표시
   *  - hide()되면 Dock 숨김
   */
  if (isMac) {
    // 창이 실제 보이기 시작할 때
    win.on("show", () => {
      app.dock.show();
    });
    // 창이 hide될 때
    win.on("hide", () => {
      app.dock.hide();
    });
  }

  // 닫기 시도 -> 실제로는 숨김
  win.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win?.hide();
      // hide() 이벤트에서 Dock도 같이 hide됨
    }
  });

  // 개발/프로덕션 로드
  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL!);
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // 외부링크 -> 기본 브라우저
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Tray 아이콘 생성
  createTray(win);
  // 업데이트 체크 리스너
  update(win);
}

// app 종료 전 처리
app.on("before-quit", (e) => {
  if (!isQuitting) {
    e.preventDefault();
    if (win) {
      win.hide();
      if (process.platform === "darwin") {
        // hide
        app.dock.hide();
      }
    }
  }
});

app.whenReady().then(() => {
  createWindow();

  // 전역 단축키 예시
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    console.log("Global Shortcut Triggered!");
    if (win) {
      win.webContents.send("shortcut-triggered", "Hello from main!");
    }
  });
});

// 창이 모두 닫혀도(실제로는 hide) 앱 종료 안 함
app.on("window-all-closed", () => {
  win = null;
});

// 두 번째 인스턴스가 실행될 때 -> 기존 창 복원
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// 맥에서 Dock 아이콘 클릭 -> 창 show
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win?.show();
  }
});

// Tray 메뉴 "Quit"에서만 isQuitting=true -> 진짜 종료 허용
export function setIsQuitting(val: boolean) {
  isQuitting = val;
}
