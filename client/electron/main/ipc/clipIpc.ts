import { ipcMain } from "electron";
import { getRepositories } from "../di";
import { runClipAction } from "../clipActions";
import { Clip } from "../domain/clip";

export function initClipIpc() {
  // 클립 전체 조회
  ipcMain.handle("clips-load", async () => {
    const { clipRepository } = getRepositories();
    return await clipRepository.findAll();
  });

  // 클립 생성
  ipcMain.handle("clips-insert", async (_e, clip: Clip) => {
    const { clipRepository } = getRepositories();
    await clipRepository.create(clip);
    return { success: true };
  });

  // 클립 수정
  ipcMain.handle("clips-update", async (_e, clip: Clip) => {
    const { clipRepository } = getRepositories();
    await clipRepository.update(clip);
    return { success: true };
  });

  // 클립 삭제
  ipcMain.handle("clips-delete", async (_e, clipId: string) => {
    const { clipRepository } = getRepositories();
    await clipRepository.deleteById(clipId);
    return { success: true };
  });

  /**
   * clip-run 이벤트
   *  - 클라이언트 측에서 특정 clip 액션(copy, txtExtract)을 실행하고자 할 때
   *  - runClipAction(...) 호출 후, 완료 메시지 송신
   */
  ipcMain.on("clip-run", (event, clipData) => {
    runClipAction(
      clipData.actionType,
      clipData.selectedPaths,
      clipData.actionCode,
    );
    let msg = "";
    if (clipData.actionType === "copy") {
      msg = "Copied to clipboard!";
    } else if (clipData.actionType === "txtExtract") {
      msg = "Txt extract done (copied)!";
    }
    event.sender.send("clip-run-done", { message: msg });
  });
}
