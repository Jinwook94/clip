import { ipcMain } from "electron";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { autoUpdater } = require("electron-updater");

/**
 * initUpdateIpc()
 *  - check-update, start-download, quit-and-install 등
 */
export function initUpdateIpc() {
  autoUpdater.autoDownload = false;

  ipcMain.handle("check-update", async () => {
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      return result;
    } catch (err) {
      return { error: err };
    }
  });

  ipcMain.handle("start-download", async (event) => {
    autoUpdater.downloadUpdate();
    return { success: true };
  });

  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true);
  });
}
