import fs from "node:fs";
import path from "node:path";

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export function readDirectoryStructure(dirPath: string): FileNode {
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error("Not a directory: " + dirPath);
  }

  function traverse(currentPath: string): FileNode[] {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    return entries.map<FileNode>((entry) => {
      const fullPath = path.join(currentPath, entry.name);
      const isDir = entry.isDirectory();
      return {
        name: entry.name,
        path: fullPath,
        isDirectory: isDir,
        // 재귀
        children: isDir ? traverse(fullPath) : undefined,
      };
    });
  }

  return {
    name: path.basename(dirPath),
    path: dirPath,
    isDirectory: true,
    children: traverse(dirPath),
  };
}
