import { globalShortcut, ipcMain } from "electron";
import { runClipAction } from "./clipActions.js";

interface ClipItem {
  id: string;
  name: string;
  selectedPaths: string[];
  actionType: string;
  actionCode?: string;
  shortcut?: string;
}

let currentClips: ClipItem[] = [];

export function initGlobalShortcuts() {
  // IPC: Renderer에서 "clips-sync"로 clips 배열 전달
  ipcMain.on("clips-sync", (_evt, newClips: ClipItem[]) => {
    currentClips = newClips;
    reRegisterShortcuts();
  });
}

function reRegisterShortcuts() {
  globalShortcut.unregisterAll();

  for (const clip of currentClips) {
    if (!clip.shortcut) continue;
    const sc = clip.shortcut;
    const success = globalShortcut.register(sc, () => {
      console.log(`Shortcut triggered for clip: ${clip.name}`);
      runClipAction(
        clip.actionType as never,
        clip.selectedPaths,
        clip.actionCode,
      );
    });
    if (!success) {
      console.warn("Failed to register global shortcut:", sc);
    }
  }
}
