import { app, BrowserWindow, shell, globalShortcut } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import store from "./store";
import { createTray } from "./tray";
import { update } from "./update";
import { initAllIpc } from "./ipc";
import { initAppRepositories } from "./di";
import { registerGlobalShortcuts } from "./globalShortcuts";

let win: BrowserWindow | null = null;
let isQuitting = false;

// 전역에서 메인 윈도우에 접근할 수 있도록 변수에 할당
export let mainWindow: BrowserWindow | null = null;

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
  // DB 초기화 및 IPC 등록
  const repos = initAppRepositories();
  initAllIpc();

  const allBlocks = await repos.blockRepository.findAll();
  console.log("[DB] loaded blocks =>", allBlocks);

  const { width = 900, height = 680 } = store.get("windowBounds") || {};
  const isMac = process.platform === "darwin";

  // Windows: skipTaskbar true, Mac: Dock 제어
  win = new BrowserWindow({
    title: "Clip",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width,
    height,
    skipTaskbar: process.platform !== "darwin",
    frame: isMac ? true : false,
    titleBarStyle: isMac ? "hiddenInset" : undefined,
    trafficLightPosition: isMac ? { x: 20, y: 16 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
    },
  });

  // 메인 윈도우 전역 변수에 저장 (global.mainWindow)
  mainWindow = win;

  // 창 크기 변경 시 저장
  win.on("resize", () => {
    if (!win) return;
    const { width, height } = win.getBounds();
    store.set("windowBounds", { width, height });
  });

  // Mac 전용: 창 show/hide 시 Dock 제어
  if (isMac) {
    win.on("show", () => {
      app.dock.show();
    });
    win.on("hide", () => {
      app.dock.hide();
    });
  }

  // 창 닫기 시 실제로는 숨김 처리
  win.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win?.hide();
    }
  });

  // 개발/프로덕션 환경에 따라 페이지 로드
  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL!);
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // 외부 링크는 기본 브라우저로 열기
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Tray 아이콘 생성 및 업데이트 체크
  createTray(win);
  update(win);

  // 글로벌 단축키 등록
  await registerGlobalShortcuts();
}

// 앱 종료 전 처리 (앱 숨기기)
app.on("before-quit", (e) => {
  if (!isQuitting) {
    e.preventDefault();
    if (win) {
      win.hide();
      if (process.platform === "darwin") {
        app.dock.hide();
      }
    }
  }
});

app.whenReady().then(() => {
  createWindow();

  // (옵션) 기존 예제 단축키 – 필요 없으면 주석 처리 가능
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    console.log("Global Shortcut Triggered!");
    if (win) {
      win.webContents.send("shortcut-triggered", "Hello from main!");
    }
  });
});

// 창이 모두 닫혀도 앱 종료하지 않음
app.on("window-all-closed", () => {
  win = null;
});

// 두 번째 인스턴스 실행 시 기존 창 복원
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// Mac에서 Dock 아이콘 클릭 시 창 보이기 및 단축키 재등록
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win?.show();
    // 앱 활성화 시 단축키 재등록 (혹은 필요시 업데이트)
    registerGlobalShortcuts().catch(console.error);
  }
});

// Tray 메뉴 "Quit"에서만 isQuitting를 true로 설정하여 앱 종료 허용
export function setIsQuitting(val: boolean) {
  isQuitting = val;
}
