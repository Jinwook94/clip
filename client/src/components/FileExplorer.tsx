import React, { useEffect, useState, useCallback } from "react";
import {
  IconChevronRight,
  IconChevronDown,
  IconChevronsDown,
  IconChevronsUp,
} from "@tabler/icons-react";

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
  // expandedNodes: 모든 디렉토리가 기본으로 펼쳐지도록 초기값 설정 (트리 로딩 후 갱신)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 재귀적으로 모든 디렉토리 경로를 수집하는 함수
  const getAllDirectoryPaths = useCallback((node: FileNode): string[] => {
    let dirs: string[] = [];
    if (node.isDirectory) {
      dirs.push(node.path);
      if (node.children) {
        node.children.forEach((child) => {
          dirs = dirs.concat(getAllDirectoryPaths(child));
        });
      }
    }
    return dirs;
  }, []);

  // root가 로드되면 모든 디렉토리를 기본으로 펼치도록 설정
  useEffect(() => {
    if (root) {
      const allDirs = getAllDirectoryPaths(root);
      setExpandedNodes(new Set(allDirs));
    }
  }, [root, getAllDirectoryPaths]);

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
      const already = isSelected(filePath);
      if (already) {
        onChangeSelected(selectedPaths.filter((p) => p !== filePath));
      } else {
        onChangeSelected([filePath]);
      }
    }
    setLastClicked(filePath);
  };

  // 아이콘 클릭 시에만 디렉토리의 접힘/펼침을 토글
  const toggleExpand = (path: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // 재귀적으로 FileNode를 렌더링
  const renderNode = (node: FileNode, indent: number = 0) => {
    return (
      <div key={node.path} style={{ marginLeft: indent * 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: isSelected(node.path)
              ? "rgba(0,150,255,0.3)"
              : "transparent",
            padding: "4px 8px", // 클릭 영역 확장
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectItem(node.path, e);
          }}
        >
          {node.isDirectory && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.path);
              }}
              style={{ cursor: "pointer", marginRight: 4 }}
            >
              {expandedNodes.has(node.path) ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )}
            </span>
          )}
          <div>
            {node.isDirectory ? "📂" : "📄"} {node.name}
          </div>
        </div>
        {node.isDirectory &&
          expandedNodes.has(node.path) &&
          node.children &&
          node.children.map((child) => renderNode(child, indent + 1))}
      </div>
    );
  };

  return (
    <div>
      {/* 전체 펼치기/접기 버튼 */}
      <div className="flex items-center justify-end mb-2 space-x-2">
        <button
          onClick={() => {
            if (root) {
              const allDirs = getAllDirectoryPaths(root);
              setExpandedNodes(new Set(allDirs));
            }
          }}
          title="Expand All"
          className="p-1 border rounded hover:bg-gray-200"
        >
          <IconChevronsDown size={16} />
        </button>
        <button
          onClick={() => setExpandedNodes(new Set())}
          title="Collapse All"
          className="p-1 border rounded hover:bg-gray-200"
        >
          <IconChevronsUp size={16} />
        </button>
      </div>
      <h4 className="mb-2">File Explorer (Root: {projectRoot})</h4>
      {root ? renderNode(root) : <p>Loading...</p>}
    </div>
  );
}

function getRangePaths(
  root: FileNode | null,
  pathA: string,
  pathB: string,
): string[] | null {
  if (!root) return null;
  const all: string[] = [];
  function dfs(n: FileNode) {
    all.push(n.path);
    if (n.children) {
      n.children.forEach((c) => dfs(c));
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
