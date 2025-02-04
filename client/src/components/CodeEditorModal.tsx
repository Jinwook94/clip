import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CodeEditorModalProps {
  open: boolean;
  initialCode: string;
  onClose: () => void;
  onSave: (newCode: string) => void;
}

const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
  open,
  initialCode,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleSave = () => {
    onSave(code);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Code</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full h-80 p-2 border rounded font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <DialogFooter className="mt-4 flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeEditorModal;
