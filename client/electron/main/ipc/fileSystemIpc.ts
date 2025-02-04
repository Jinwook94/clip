// client/electron/main/ipc/fileSystemIpc.ts
import { ipcMain, dialog } from "electron";
import { readDirectoryStructure } from "../fileSystem";

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

  // 파일 선택 다이얼로그 (여러 파일 선택)
  ipcMain.handle("show-file-dialog", async (_event) => {
    const result = await dialog.showOpenDialog({
      title: "Select Files and Directories",
      properties: ["openFile", "openDirectory", "multiSelections"],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }
    return result.filePaths;
  });
}
