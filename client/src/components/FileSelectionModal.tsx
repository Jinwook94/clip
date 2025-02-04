// client/src/components/FileSelectionModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FileExplorer, { FileNode } from "./FileExplorer";

interface FileSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedPaths: string[]) => void;
  initialRoot?: string;
  initialSelected?: string[]; // 기존에 선택된 파일 경로들
}

export default function FileSelectionModal({
  open,
  onClose,
  onConfirm,
  initialRoot,
  initialSelected = [],
}: FileSelectionModalProps) {
  const [projectRoot, setProjectRoot] = useState<string>("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>(initialSelected);

  // initialSelected prop이 변경될 때 selectedPaths를 업데이트
  useEffect(() => {
    setSelectedPaths(initialSelected);
  }, [initialSelected]);

  // 모달이 열리면, initialRoot가 있다면 바로 사용, 없으면 IPC로 선택 다이얼로그 호출
  useEffect(() => {
    if (open) {
      if (initialRoot) {
        setProjectRoot(initialRoot);
      } else if (!projectRoot) {
        window.ipcRenderer
          .invoke("show-directory-dialog")
          .then((root: string | null) => {
            if (root) {
              setProjectRoot(root);
            }
          });
      }
    }
  }, [open, projectRoot, initialRoot]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Files and Directories</DialogTitle>
        </DialogHeader>
        {projectRoot ? (
          // 파일 선택 영역에 최대 높이와 스크롤 적용
          <div className="max-h-96 overflow-y-auto">
            <FileExplorer
              projectRoot={projectRoot}
              selectedPaths={selectedPaths}
              onChangeSelected={setSelectedPaths}
            />
          </div>
        ) : (
          <div>No project root selected.</div>
        )}
        {/* Selected Count를 항상 보여지도록 DialogFooter에 배치 */}
        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm">Selected Count: {selectedPaths.length}</div>
          <Button onClick={() => onConfirm(selectedPaths)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
