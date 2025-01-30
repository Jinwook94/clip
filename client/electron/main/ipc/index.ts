import { ipcMain } from "electron";
import store from "../store";
import { initBlockIpc } from "./blockIpc";
// 만약 파일 탐색이 필요하면 아래처럼 (주석 해제)
// import { initFileSystemIpc } from "./fileSystemIpc";
// import { initUpdateIpc } from "./updateIpc";

export function initAllIpc() {
  initBlockIpc();

  // 필요 시:
  // initFileSystemIpc();
  // initUpdateIpc();

  ipcMain.handle("set-language", (_evt, lang: string) => {
    store.set("locale", lang);
    return { success: true };
  });
}
