import { app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import type { UpdateInfo } from "electron-updater";

const { autoUpdater } = createRequire(import.meta.url)("electron-updater");

/**
 * update(win: BrowserWindow)
 *  - autoUpdater 이벤트 리스너만 설정
 *  - IPC 등록(ipcMain.handle("check-update", ...))은 제거하여
 *    'Attempted to register a second handler for "check-update"' 에러를 방지
 */
export function update(win: BrowserWindow) {
  // 업데이트 자동다운로드 비활성
  autoUpdater.autoDownload = false;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = false;

  // 이벤트 리스너: checking-for-update
  autoUpdater.on("checking-for-update", () => {
    // 필요시 로그 or win.webContents.send(...)
  });

  // 이벤트 리스너: update-available
  autoUpdater.on("update-available", (updateInfo: UpdateInfo) => {
    win.webContents.send("update-can-available", {
      update: true,
      version: app.getVersion(),
      newVersion: updateInfo?.version,
    });
  });

  // 이벤트 리스너: update-not-available
  autoUpdater.on("update-not-available", (updateInfo: UpdateInfo) => {
    win.webContents.send("update-can-available", {
      update: false,
      version: app.getVersion(),
      newVersion: updateInfo?.version,
    });
  });

  // 필요하면 여기서도 autoUpdater.on("download-progress", ...) 등 추가 가능
  // 단, IPC 등록은 updateIpc.ts 등에서 관리
}
