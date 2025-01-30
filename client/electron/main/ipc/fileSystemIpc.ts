import { ipcMain, dialog } from "electron";
import { readDirectoryStructure } from "../fileSystem";

/**
 * initFileSystemIpc()
 *  - show-directory-dialog
 *  - read-dir-structure
 */
export function initFileSystemIpc() {
  ipcMain.handle("show-directory-dialog", async (_event) => {
    const result = await dialog.showOpenDialog({
      title: "Select Project Root",
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle("read-dir-structure", (_event, rootDir: string) => {
    return readDirectoryStructure(rootDir);
  });
}
