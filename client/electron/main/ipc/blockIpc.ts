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
   *  - clip 블록인지 확인 후, 자식 중 필요한 블록타입이 모두 있어야 runClipAction
   */
  ipcMain.on("block-run", async (event: IpcMainEvent, blockData: AnyBlock) => {
    if (blockData.type !== "clip") {
      event.sender.send("clip-run-done", {
        error: true,
        message: "Not a clip block. Cannot run.",
      });
      return;
    }

    // blockData => ClipBlock
    const clipBlock = blockData as ClipBlock;
    const allBlocks = await blockRepository.findAll();
    const children = allBlocks.filter((b) => clipBlock.content.includes(b.id));

    // clip 내부에 action 블록이 반드시 1개 있어야 함
    const actionBlock = children.find((b) => b.type === "action") as
      | ActionBlock
      | undefined;
    if (!actionBlock) {
      event.sender.send("clip-run-done", {
        error: true,
        message: "Missing an action block in this clip.",
      });
      return;
    }

    // actionBlock.properties.actionType (디폴트 "copy")
    const actionType =
      typeof actionBlock.properties.actionType === "string"
        ? (actionBlock.properties.actionType as string)
        : "copy";

    // actionBlock.properties.requiredBlockTypes (예: ["project_root", "selected_path"] 등)
    // 만약 설정이 없고 actionType이 "copy" 라면 디폴트로 project_root, selected_path가 필요하다고 가정
    let requiredBlockTypes =
      (actionBlock.properties.requiredBlockTypes as string[]) ?? [];
    if (requiredBlockTypes.length === 0 && actionType === "copy") {
      requiredBlockTypes = ["project_root", "selected_path"];
    }

    // requiredBlockTypes 에 있는 블록타입이 모두 children에 존재해야 함
    const missingTypes: string[] = [];
    for (const requiredType of requiredBlockTypes) {
      const hasIt = children.some((c) => c.type === requiredType);
      if (!hasIt) {
        missingTypes.push(requiredType);
      }
    }
    if (missingTypes.length > 0) {
      event.sender.send("clip-run-done", {
        error: true,
        message: `Missing required blocks: ${missingTypes.join(", ")}`,
      });
      return;
    }

    // actionType에 따라 (예: selected_paths 필요)
    // selectedPathsBlock
    const selectedPathsBlock = children.find(
      (b) => b.type === "selected_path",
    ) as SelectedPathBlock | undefined;
    let selectedPaths: string[] = [];
    if (
      selectedPathsBlock?.properties?.paths &&
      Array.isArray(selectedPathsBlock.properties.paths)
    ) {
      selectedPaths = selectedPathsBlock.properties.paths as string[];
    }

    // 실제 액션 실행
    runClipAction(actionType, selectedPaths);

    event.sender.send("clip-run-done", {
      error: false,
      message: `Clip run done! (action=${actionType})`,
    });
  });
}
