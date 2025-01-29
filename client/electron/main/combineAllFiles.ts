import fs from "node:fs";
import path from "node:path";

/**
 * @param root 프로젝트 루트 디렉토리
 * @returns 최종 합쳐진 텍스트
 */
export function gatherProjectFilesForClipboard(root: string): string {
  let output = "";

  // 1) 프로젝트 구조 (tree)
  output += `# Project structure:\n`;
  // 간단히 동기적으로 재귀
  output += generateTree(root, 0, [
    "node_modules",
    "dist",
    ".idea",
    "script",
    "test",
  ]);
  output += "\n";

  // 2) 기술스택
  output += `# Project Tech stack:\n`;
  output += `- TypeScript ^5.4.2\n- Electron ^33.2.0\n- React ^18.3.1\n...\n\n`;

  // 3) 모든 소스코드
  output += `# Full Project Source Code:\n\n`;

  // 파일 탐색 & 필터
  const validExts = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".css",
    ".html",
    ".json",
    ".sh",
  ];
  const ignoreDirs = [
    "node_modules",
    "dist",
    ".idea",
    "script",
    "test",
    ".vscode",
    ".github",
  ];
  function traverseDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (ignoreDirs.includes(e.name)) continue;
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        traverseDir(fullPath);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (validExts.includes(ext)) {
          // append path + file content
          const relPath = path.relative(root, fullPath);
          output += `# ${relPath}:\n`;
          const content = fs.readFileSync(fullPath, "utf-8");
          output += content + "\n\n";
        }
      }
    }
  }
  traverseDir(root);

  return output;
}

function generateTree(dir: string, level: number, ignore: string[]): string {
  let treeStr = "";
  const indent = "  ".repeat(level);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (ignore.includes(e.name)) continue;
    const name = e.name;
    const fullPath = path.join(dir, name);
    if (e.isDirectory()) {
      treeStr += `${indent}|-- ${name}/\n`;
      treeStr += generateTree(fullPath, level + 1, ignore);
    } else {
      treeStr += `${indent}|-- ${name}\n`;
    }
  }
  return treeStr;
}
