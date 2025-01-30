import { initClipIpc } from "./clipIpc";
import { initFileSystemIpc } from "./fileSystemIpc";
import { initGlobalShortcutsIpc } from "./globalShortcutsIpc";
import { initLabelIpc } from "./labelIpc";
import { initUpdateIpc } from "./updateIpc";

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
}
