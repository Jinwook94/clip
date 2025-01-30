import { BrowserWindow, ipcMain } from "electron";
import localShortcut from "electron-localshortcut";

/**
 * 예시:
 *  - 윈도우별 단축키 등록
 *  - 언어가 바뀌어도 키 조합 자체는 같지만,
 *    IM E나 레이아웃 충돌을 electron-localshortcut 이 조금 더 깔끔히 처리.
 */
export function initLocalShortcutsIpc(win: BrowserWindow) {
  // 원하는 시점에 등록
  localShortcut.register(win, "CommandOrControl+Shift+Q", () => {
    console.log("[localShortcutsIpc] local shortcut triggered!");
    win.webContents.send("shortcut-triggered-local", "Local Shortcut Fired!");
  });

  // 필요시 IPC로 해제
  ipcMain.on("unregister-local-shortcuts", () => {
    localShortcut.unregisterAll(win);
  });
}
