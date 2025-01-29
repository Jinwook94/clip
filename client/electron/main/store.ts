import Store from "electron-store";

interface ClipStoreSchema {
  windowBounds?: {
    width: number;
    height: number;
  };
  theme?: string;
  locale?: string;
}

const store = new Store<ClipStoreSchema>({
  name: "clip-preferences",
  fileExtension: "json",
});

export default store;
