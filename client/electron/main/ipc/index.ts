import { ipcMain } from "electron";
import store from "../store";
import { initBlockIpc } from "./blockIpc";
import { initFileSystemIpc } from "./fileSystemIpc";
import { initBlockTypeIpc } from "./blockTypeIpc";

export function initAllIpc() {
  initBlockIpc();
  initFileSystemIpc();
  initBlockTypeIpc();

  ipcMain.handle("set-language", (_evt, lang: string) => {
    store.set("locale", lang);
    return { success: true };
  });
}
