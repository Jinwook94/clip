import React, { useEffect, useState } from "react";

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface FileExplorerProps {
  projectRoot: string;
  selectedPaths: string[];
  onChangeSelected: (newPaths: string[]) => void;
}

export default function FileExplorer({
  projectRoot,
  selectedPaths,
  onChangeSelected,
}: FileExplorerProps) {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  useEffect(() => {
    if (!projectRoot) return;
    window.ipcRenderer
      .invoke("read-dir-structure", projectRoot)
      .then((res: FileNode) => {
        setRoot(res);
      })
      .catch(console.error);
  }, [projectRoot]);

  const isSelected = (filePath: string) => selectedPaths.includes(filePath);

  const handleSelectItem = (filePath: string, evt: React.MouseEvent) => {
    const isShift = evt.shiftKey;
    const isCtrl = evt.metaKey || evt.ctrlKey;

    if (isShift && lastClicked && lastClicked !== filePath) {
      const range = getRangePaths(root, lastClicked, filePath);
      if (range) {
        const newSet = new Set([...selectedPaths, ...range]);
        onChangeSelected(Array.from(newSet));
      }
    } else if (isCtrl) {
      const already = isSelected(filePath);
      if (already) {
        onChangeSelected(selectedPaths.filter((p) => p !== filePath));
      } else {
        onChangeSelected([...selectedPaths, filePath]);
      }
    } else {
      // 그냥 클릭
      const already = isSelected(filePath);
      if (already) {
        // 해제
        onChangeSelected(selectedPaths.filter((p) => p !== filePath));
      } else {
        // 단일 선택
        onChangeSelected([filePath]);
      }
    }

    setLastClicked(filePath);
  };

  const renderNode = (node: FileNode) => {
    return (
      <div key={node.path} style={{ marginLeft: 16 }}>
        <div
          style={{
            backgroundColor: isSelected(node.path)
              ? "rgba(0,150,255,0.3)"
              : "transparent",
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectItem(node.path, e);
          }}
        >
          {node.isDirectory ? "📂" : "📄"} {node.name}
        </div>
        {node.isDirectory && node.children?.map((child) => renderNode(child))}
      </div>
    );
  };

  return (
    <div>
      <h4>File Explorer (Root: {projectRoot})</h4>
      {root ? renderNode(root) : <p>Loading...</p>}
      <div style={{ marginTop: 8 }}>Selected Count: {selectedPaths.length}</div>
    </div>
  );
}

function getRangePaths(root: FileNode | null, pathA: string, pathB: string) {
  if (!root) return null;
  const all: string[] = [];
  function dfs(n: FileNode) {
    all.push(n.path);
    if (n.children) {
      for (const c of n.children) {
        dfs(c);
      }
    }
  }
  dfs(root);
  const idxA = all.indexOf(pathA);
  const idxB = all.indexOf(pathB);
  if (idxA < 0 || idxB < 0) return null;
  const start = Math.min(idxA, idxB);
  const end = Math.max(idxA, idxB);
  return all.slice(start, end + 1);
}
