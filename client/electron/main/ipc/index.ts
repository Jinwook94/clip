import { ipcMain } from "electron";
import store from "../store";
import { initBlockIpc } from "./blockIpc";
import { initFileSystemIpc } from "./fileSystemIpc";
// import { initUpdateIpc } from "./updateIpc";

export function initAllIpc() {
  initBlockIpc();
  initFileSystemIpc(); // 파일 시스템 관련 IPC 핸들러 등록

  // 필요 시:
  // initUpdateIpc();

  ipcMain.handle("set-language", (_evt, lang: string) => {
    store.set("locale", lang);
    return { success: true };
  });
}
