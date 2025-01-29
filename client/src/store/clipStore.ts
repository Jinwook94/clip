import { create } from "zustand";
import { nanoid } from "nanoid";

export type ActionType = "copy" | "txtExtract";
export interface ClipItem {
  id: string;
  name: string;
  projectRoot: string;
  selectedPaths: string[];
  actionType: ActionType;
  actionCode?: string;
  shortcut?: string;
  // gitRoot?: string;
}

interface ClipStore {
  clips: ClipItem[];
  loadClipsFromDB: () => Promise<void>;
  addClip: (clip: Omit<ClipItem, "id">) => Promise<string>;
  updateClip: (id: string, partial: Partial<ClipItem>) => Promise<void>;
  removeClip: (id: string) => Promise<void>;
  setClips: (clips: ClipItem[]) => void;
}

export const useClipStore = create<ClipStore>((set, get) => ({
  clips: [],

  // 1) DB에서 로드
  async loadClipsFromDB() {
    const data: ClipItem[] = await window.ipcRenderer.invoke("clips-load");
    set({ clips: data });
  },

  // 2) Clip 추가
  async addClip(clipData) {
    const id = nanoid();
    const newClip: ClipItem = { ...clipData, id };
    // DB 인서트
    await window.ipcRenderer.invoke("clips-insert", newClip);
    // zustand state 업데이트
    set((state) => ({ clips: [...state.clips, newClip] }));
    return id;
  },

  // 3) Clip 수정
  async updateClip(id, partial) {
    const existing = get().clips.find((c) => c.id === id);
    if (!existing) return;
    const updated: ClipItem = { ...existing, ...partial };
    // DB 업데이트
    await window.ipcRenderer.invoke("clips-update", updated);
    // Zustand 업데이트
    set((state) => ({
      clips: state.clips.map((c) => (c.id === id ? updated : c)),
    }));
  },

  // 4) Clip 삭제
  async removeClip(id) {
    await window.ipcRenderer.invoke("clips-delete", id);
    set((state) => ({
      clips: state.clips.filter((c) => c.id !== id),
    }));
  },

  setClips: (clips) => set(() => ({ clips })),
}));
