import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from "electron";
import { getRepositories } from "../di";
import type {
  AnyBlock,
  ClipBlock,
  ActionBlock,
  SelectedPathBlock,
} from "../domain/block";
import { clipboard } from "electron";

/**
 * runClipAction:
 *  - 실제 copy / txtExtract 등의 액션을 수행
 *  - require("electron")가 아니라 import { clipboard } from "electron" 사용
 */
export function runClipAction(actionType: string, filePaths: string[]): void {
  if (actionType === "copy") {
    clipboard.writeText("Copied: \n" + filePaths.join("\n"));
  } else if (actionType === "txtExtract") {
    clipboard.writeText("TxtExtract: \n" + filePaths.join("\n"));
  } else {
    clipboard.writeText("Unknown action. Doing nothing.");
  }
}

/**
 * initBlockIpc()
 *  - blocks-load, blocks-create, blocks-update, blocks-delete
 *  - block-run (clip 블록 실행 시도) 등 IPC 핸들러 등록
 */
export function initBlockIpc(): void {
  const { blockRepository } = getRepositories();

  /**
   * blocks-load
   */
  ipcMain.handle("blocks-load", async () => {
    return await blockRepository.findAll();
  });

  /**
   * blocks-create
   */
  ipcMain.handle(
    "blocks-create",
    async (_evt: IpcMainInvokeEvent, partial: Partial<AnyBlock>) => {
      const newId = await blockRepository.create(partial);
      return { success: true, newId };
    },
  );

  /**
   * blocks-update
   */
  ipcMain.handle(
    "blocks-update",
    async (_evt: IpcMainInvokeEvent, block: AnyBlock) => {
      await blockRepository.update(block);
      return { success: true };
    },
  );

  /**
   * blocks-delete
   */
  ipcMain.handle(
    "blocks-delete",
    async (_evt: IpcMainInvokeEvent, blockId: string) => {
      await blockRepository.deleteById(blockId);
      return { success: true };
    },
  );

  /**
   * block-run
   *  - clip 블록인지 확인 후, 자식 중 project_root, selected_path, action 블록이 모두 있어야 runClipAction
   */
  ipcMain.on("block-run", async (event: IpcMainEvent, blockData: AnyBlock) => {
    if (blockData.type !== "clip") {
      event.sender.send("block-run-done", {
        error: true,
        message: "Not a clip block. Cannot run.",
      });
      return;
    }

    // blockData => ClipBlock
    const clipBlock = blockData as ClipBlock;
    const allBlocks = await blockRepository.findAll();
    const children = allBlocks.filter((b) => clipBlock.content.includes(b.id));

    const hasProjectRoot = children.some((c) => c.type === "project_root");
    const hasSelectedPath = children.some((c) => c.type === "selected_path");
    const hasAction = children.some((c) => c.type === "action");

    if (!hasProjectRoot || !hasSelectedPath || !hasAction) {
      event.sender.send("block-run-done", {
        error: true,
        message:
          "Clip requires project_root, selected_path, and action blocks. Missing at least one.",
      });
      return;
    }

    // actionBlock
    const actionBlock = children.find((b) => b.type === "action") as
      | ActionBlock
      | undefined;
    const actionType =
      typeof actionBlock?.properties?.actionType === "string"
        ? actionBlock.properties.actionType
        : "copy";

    // selectedPathsBlock
    const selectedPathsBlock = children.find(
      (b) => b.type === "selected_path",
    ) as SelectedPathBlock | undefined;
    const selectedPaths = Array.isArray(selectedPathsBlock?.properties?.paths)
      ? selectedPathsBlock.properties.paths
      : [];

    // 실제 실행
    runClipAction(actionType, selectedPaths);

    event.sender.send("block-run-done", {
      error: false,
      message: `Clip run done! (action=${actionType})`,
    });
  });
}
