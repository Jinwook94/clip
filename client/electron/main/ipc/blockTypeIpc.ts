import { ipcMain } from "electron";
import { getRepositories } from "../di";

export function initBlockTypeIpc() {
  const { blockTypeRepository } = getRepositories();
  ipcMain.handle("blockTypes-load", async () => {
    return await blockTypeRepository.findAll();
  });
  ipcMain.handle("blockTypes-create", async (_evt, partial) => {
    const newId = await blockTypeRepository.create(partial);
    return { success: true, newId };
  });
  ipcMain.handle("blockTypes-update", async (_evt, blockType) => {
    await blockTypeRepository.update(blockType);
    return { success: true };
  });
  ipcMain.handle("blockTypes-delete", async (_evt, id) => {
    await blockTypeRepository.deleteById(id);
    return { success: true };
  });
}
