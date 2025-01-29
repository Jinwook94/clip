import { Tray, Menu, BrowserWindow, app } from "electron";
import path from "node:path";

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow) {
  const iconPath = path.join(process.env.APP_ROOT, "build", "icon.png");

  tray = new Tray(iconPath);
  tray.setToolTip("Clip App");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Clip",
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // macOS: 아이콘 클릭 시 메뉴
  tray.on("click", () => {
    tray?.popUpContextMenu();
  });
}
