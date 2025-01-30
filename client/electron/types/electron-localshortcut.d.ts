declare module "electron-localshortcut" {
  import { BrowserWindow } from "electron";

  function register(
    window: BrowserWindow,
    accelerator: string,
    callback: () => void,
  ): boolean;

  function unregister(window: BrowserWindow, accelerator: string): void;

  function unregisterAll(window: BrowserWindow): void;

  export { register, unregister, unregisterAll };
  export default { register, unregister, unregisterAll };
}
