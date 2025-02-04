import { globalShortcut } from "electron";
import { getRepositories } from "./di";
import type { ClipBlock } from "./domain/block";
import { runClipBlock } from "./runClipBlock";

let registeredShortcuts: Record<string, string> = {};

export async function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  registeredShortcuts = {};

  const { blockRepository } = getRepositories();
  const allBlocks = await blockRepository.findAll();

  const clipBlocks = allBlocks.filter(
    (b) => b.type === "clip" && b.properties.shortcut,
  ) as ClipBlock[];

  for (const clip of clipBlocks) {
    const shortcut = clip.properties.shortcut as string;
    if (!registeredShortcuts[shortcut]) {
      const success = globalShortcut.register(shortcut, async () => {
        console.log(
          `Global shortcut ${shortcut} pressed; running clip ${clip.id}`,
        );

        // **Main에서 직접 실행!**
        const result = await runClipBlock(clip.id);
        if (result.error) {
          console.error("[clip run] ERROR:", result.message);
        } else {
          console.log("[clip run] SUCCESS:", result.message);
        }

        // 원한다면, 여기서 mainWindow.webContents.send("clip-run-done", result);
        // 로 renderer 쪽에도 알릴 수 있음.
      });

      if (success) {
        registeredShortcuts[shortcut] = clip.id;
        console.log(
          `Registered global shortcut: ${shortcut} => clip ${clip.id}`,
        );
      } else {
        console.error(`Failed to register global shortcut: ${shortcut}`);
      }
    }
  }
}
