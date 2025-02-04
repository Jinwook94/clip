import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from "electron";
import { createRequire } from "node:module";
import { getRepositories } from "../di";
import type { AnyBlock, ClipBlock, ActionBlock } from "../domain/block";

export function initBlockIpc(): void {
  const { blockRepository } = getRepositories();

  ipcMain.handle("blocks-load", async () => {
    return await blockRepository.findAll();
  });

  ipcMain.handle(
    "blocks-create",
    async (_evt: IpcMainInvokeEvent, partial: Partial<AnyBlock>) => {
      const newId = await blockRepository.create(partial);
      return { success: true, newId };
    },
  );

  ipcMain.handle(
    "blocks-update",
    async (_evt: IpcMainInvokeEvent, block: AnyBlock) => {
      await blockRepository.update(block);
      return { success: true };
    },
  );

  ipcMain.handle(
    "blocks-delete",
    async (_evt: IpcMainInvokeEvent, blockId: string) => {
      await blockRepository.deleteById(blockId);
      return { success: true };
    },
  );

  ipcMain.on("block-run", async (event: IpcMainEvent, blockData: AnyBlock) => {
    if (blockData.type !== "clip") {
      event.sender.send("clip-run-done", {
        error: true,
        message: "Not a clip block. Cannot run.",
      });
      return;
    }

    // clipBlock 및 연결된 자식 블록들 가져오기
    const clipBlock = blockData as ClipBlock;
    const allBlocks = await blockRepository.findAll();
    const children = allBlocks.filter((b) => clipBlock.content.includes(b.id));

    // action block 존재 여부 확인
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

    // action block에 작성된 실행 코드가 정의되어 있는지 확인
    if (
      actionBlock.properties.code &&
      typeof actionBlock.properties.code === "string" &&
      actionBlock.properties.code.trim() !== ""
    ) {
      try {
        const userCode = actionBlock.properties.code;
        // createRequire를 사용하여 require 함수를 생성
        const requireFunc = createRequire(import.meta.url);
        // 새 Function에 "clipBlock", "children", "require" 인자를 선언
        const userFunc = new Function(
          "clipBlock",
          "children",
          "require",
          userCode,
        );
        // requireFunc를 전달하여 실행
        userFunc(clipBlock, children, requireFunc);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        event.sender.send("clip-run-done", {
          error: true,
          message: "Error executing action code: " + errorMessage,
        });
        return;
      }
    } else {
      event.sender.send("clip-run-done", {
        error: true,
        message: "No action code defined in this action block.",
      });
      return;
    }

    event.sender.send("clip-run-done", {
      error: false,
      message: "Clip run done!",
    });
  });
}
