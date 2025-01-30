import { initClipIpc } from "./clipIpc";
import { initFileSystemIpc } from "./fileSystemIpc";
import { initGlobalShortcutsIpc } from "./globalShortcutsIpc";
import { initLabelIpc } from "./labelIpc";
import { initUpdateIpc } from "./updateIpc";
import { ipcMain } from "electron";
import store from "../store";
import { changeMainLanguage } from "../i18nMain";

/**
 * initAllIpc()
 *  - 모든 IPC 핸들러를 초기화
 */
export function initAllIpc() {
  initClipIpc();
  initFileSystemIpc();
  initGlobalShortcutsIpc();
  initLabelIpc();
  initUpdateIpc();

  ipcMain.handle("set-language", (_evt, lang: string) => {
    store.set("locale", lang);
    changeMainLanguage(lang);
    return { success: true };
  });
}
