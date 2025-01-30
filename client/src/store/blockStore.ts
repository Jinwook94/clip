import { create } from "zustand";
import { nanoid } from "nanoid";

export interface BlockItem {
  id: string;
  type: string; // "clip" | "project_root" | "selected_path" | "action" 등
  properties: Record<string, unknown>;
  content: string[];
  parent: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface BlockStore {
  blocks: BlockItem[];
  loadBlocksFromDB: () => Promise<void>;
  createBlock: (partial: Partial<BlockItem>) => Promise<string>;
  updateBlock: (id: string, patch: Partial<BlockItem>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  runBlock: (blockId: string) => void;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  blocks: [],

  async loadBlocksFromDB() {
    const data: BlockItem[] = await window.ipcRenderer.invoke("blocks-load");
    set({ blocks: data });
  },

  async createBlock(partial) {
    const newId = partial.id ?? nanoid();
    const base: BlockItem = {
      id: newId,
      type: partial.type ?? "clip",
      properties: partial.properties ?? {},
      content: partial.content ?? [],
      parent: partial.parent ?? null,
    };
    // DB에 생성
    const res = await window.ipcRenderer.invoke("blocks-create", base);
    if (res.success) {
      // 최신 목록 다시 로드(혹은 낙관적 갱신)
      await get().loadBlocksFromDB();
    }
    return newId;
  },

  async updateBlock(id, patch) {
    const prev = get().blocks.find((b) => b.id === id);
    if (!prev) return;

    // properties 병합 (type 변경 시에도 기존 properties 유지)
    const mergedProps = { ...prev.properties, ...patch.properties };

    const updated: BlockItem = {
      ...prev,
      ...patch,
      properties: mergedProps,
    };

    await window.ipcRenderer.invoke("blocks-update", updated);
    // 낙관적 갱신:
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? updated : b)),
    }));
  },

  async deleteBlock(id) {
    await window.ipcRenderer.invoke("blocks-delete", id);
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
    }));
  },

  runBlock(blockId) {
    const block = get().blocks.find((b) => b.id === blockId);
    if (!block) return;
    window.ipcRenderer.send("block-run", block);
  },
}));
