import { ipcMain } from "electron";
import { getRepositories } from "../di";

/**
 * initLabelIpc()
 *  - Label CRUD, Clip-Label 연결 등 IPC 핸들러
 */
export function initLabelIpc() {
  ipcMain.handle("labels-load", async () => {
    const { labelRepository } = getRepositories();
    return await labelRepository.findAll();
  });

  ipcMain.handle("labels-create", async (_event, { id, name, color }) => {
    // id를 nanoid()로 생성해도 되고, Renderer에서 만들어도 됨
    const { labelRepository } = getRepositories();
    await labelRepository.create({
      id,
      name,
      color,
    });
    return { success: true };
  });

  ipcMain.handle("labels-update", async (_event, { id, name, color }) => {
    const { labelRepository } = getRepositories();
    await labelRepository.update({
      id,
      name,
      color,
    });
    return { success: true };
  });

  ipcMain.handle("labels-delete", async (_event, labelId: string) => {
    const { labelRepository } = getRepositories();
    await labelRepository.deleteById(labelId);
    return { success: true };
  });

  ipcMain.handle("clip-add-label", async (_event, { clipId, labelId }) => {
    const { labelRepository } = getRepositories();
    // 10개 제한
    const count = await labelRepository.countLabelsOfClip(clipId);
    if (count >= 10) {
      throw new Error("This clip already has 10 labels (max).");
    }
    await labelRepository.addLabelToClip(clipId, labelId);
    return { success: true };
  });

  ipcMain.handle("clip-remove-label", async (_event, { clipId, labelId }) => {
    const { labelRepository } = getRepositories();
    await labelRepository.removeLabelFromClip(clipId, labelId);
    return { success: true };
  });
}
